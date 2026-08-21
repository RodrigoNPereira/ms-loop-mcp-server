/** Azure CLI fallback for acquiring a delegated Loop Web Service token. */

import { execFile } from 'node:child_process';
import { decodeJwtPayload } from './token-extractor.js';
import { LOOP_API_RESOURCE } from '../constants.js';
import { logger } from '../utils/logger.js';

const AZ_TIMEOUT_MS = 15_000;
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface CachedCliToken {
  token: string;
  expiry: number;
}

let cached: CachedCliToken | null = null;

function runAzureCli(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('az', args, { encoding: 'utf8', timeout: AZ_TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Return a Loop API bearer token from the signed-in Azure CLI account.
 * The token is kept only in memory and is never printed or persisted here.
 */
export async function getAzureCliLoopToken(): Promise<string | null> {
  if (cached && cached.expiry - EXPIRY_BUFFER_MS > Date.now()) return cached.token;

  try {
    const token = await runAzureCli([
      'account',
      'get-access-token',
      '--resource',
      LOOP_API_RESOURCE,
      '--query',
      'accessToken',
      '--output',
      'tsv',
    ]);
    const payload = decodeJwtPayload(token);
    if (!token || !payload?.exp) {
      logger.debug('Azure CLI returned an invalid Loop API token');
      return null;
    }
    cached = { token, expiry: payload.exp * 1000 };
    logger.info('Acquired Loop API token from Azure CLI');
    return token;
  } catch (err) {
    logger.debug('Azure CLI Loop token acquisition failed', err instanceof Error ? err.message : String(err));
    return null;
  }
}
