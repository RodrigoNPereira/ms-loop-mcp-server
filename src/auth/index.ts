/**
 * Auth module — token access, validation, and refresh.
 *
 * Callers should use getSubstrateToken(), getSharePointToken(), and
 * getGraphToken() rather than reading the cache directly. These handle refresh
 * (HTTP first, headless browser as fallback) automatically.
 */

import { logger } from '../utils/logger.js';
import { TOKEN_REFRESH_BUFFER_MS } from '../constants.js';
import { readTokenCache } from './session-store.js';
import { refreshSubstrateToken, refreshSharePointToken, refreshGraphToken, refreshLoopApiToken } from './token-refresh.js';
import { headlessTokenRefresh } from './browser-login.js';
import { getAzureCliLoopToken } from './azure-cli.js';

export { browserLogin, headlessTokenRefresh, type LoginResult } from './browser-login.js';
export { clearSession, hasSessionState, isSessionLikelyExpired, readTokenCache } from './session-store.js';

type Resource = 'substrate' | 'sharepoint' | 'graph' | 'loopapi';

function cachedToken(resource: Resource): { token?: string; expiry?: number } {
  const cache = readTokenCache();
  if (!cache) return {};
  switch (resource) {
    case 'substrate':  return { token: cache.substrateToken, expiry: cache.substrateTokenExpiry };
    case 'sharepoint': return { token: cache.sharePointToken, expiry: cache.sharePointTokenExpiry };
    case 'graph':      return { token: cache.graphToken, expiry: cache.graphTokenExpiry };
    case 'loopapi':    return { token: cache.loopApiToken, expiry: cache.loopApiTokenExpiry };
  }
}

const httpRefreshers: Record<Resource, () => Promise<string | null>> = {
  substrate:  refreshSubstrateToken,
  sharepoint: refreshSharePointToken,
  graph:      refreshGraphToken,
  loopapi:    refreshLoopApiToken,
};

/**
 * Get a valid access token for a resource, refreshing automatically if needed.
 * Returns null if not authenticated or refresh fails.
 */
async function getToken(resource: Resource): Promise<string | null> {
  const cache = readTokenCache();
  if (!cache) return null;

  const { token, expiry } = cachedToken(resource);
  if (token && expiry && expiry - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return token;
  }

  logger.debug(`${resource} token missing or expiring soon, refreshing...`);

  // HTTP refresh first (fast, no browser)
  const httpRefreshed = await httpRefreshers[resource]();
  if (httpRefreshed) return httpRefreshed;

  // Fall back to a headless browser refresh, then re-read the cache.
  logger.info(`HTTP refresh failed for ${resource}, attempting headless browser refresh...`);
  const browserRefreshed = await headlessTokenRefresh();
  if (browserRefreshed) {
    return cachedToken(resource).token ?? null;
  }

  logger.warn('All refresh methods failed. Run loop_login to re-authenticate.');
  return null;
}

export function getSubstrateToken(): Promise<string | null>  { return getToken('substrate'); }
export function getSharePointToken(): Promise<string | null> { return getToken('sharepoint'); }
export function getGraphToken(): Promise<string | null>      { return getToken('graph'); }

/**
 * Get a Loop Web Service token. Prefer the Loop browser session and its refresh
 * token; fall back to the signed-in Azure CLI account when necessary.
 */
export async function getLoopApiToken(): Promise<string | null> {
  const cache = readTokenCache();
  const token = cache?.loopApiToken;
  const expiry = cache?.loopApiTokenExpiry;
  if (token && expiry && expiry - TOKEN_REFRESH_BUFFER_MS > Date.now()) return token;

  if (cache) {
    const refreshed = await refreshLoopApiToken();
    if (refreshed) return refreshed;
  }

  const cliToken = await getAzureCliLoopToken();
  if (cliToken) return cliToken;

  if (cache) {
    logger.info('Loop API token unavailable, attempting headless browser refresh...');
    if (await headlessTokenRefresh()) return cachedToken('loopapi').token ?? null;
  }
  return null;
}

/** Check if the user is currently authenticated (has a refresh token). */
export function isAuthenticated(): boolean {
  return !!readTokenCache()?.refreshToken;
}

/** Get auth status details for diagnostics. */
export function getAuthStatus(): {
  authenticated: boolean;
  upn?: string;
  tenantId?: string;
  sharePointResource?: string;
  substrateTokenMinutesRemaining?: number;
  sharePointTokenMinutesRemaining?: number;
  graphTokenMinutesRemaining?: number;
  loopApiTokenMinutesRemaining?: number;
} {
  const cache = readTokenCache();
  if (!cache) return { authenticated: false };

  const now = Date.now();
  const mins = (exp?: number) => (exp ? Math.max(0, Math.round((exp - now) / 60_000)) : undefined);

  return {
    authenticated: true,
    upn: cache.upn,
    tenantId: cache.tenantId,
    sharePointResource: cache.sharePointResource,
    substrateTokenMinutesRemaining: mins(cache.substrateTokenExpiry),
    sharePointTokenMinutesRemaining: mins(cache.sharePointTokenExpiry),
    graphTokenMinutesRemaining: mins(cache.graphTokenExpiry),
    loopApiTokenMinutesRemaining: mins(cache.loopApiTokenExpiry),
  };
}
