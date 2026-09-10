#!/usr/bin/env node
/**
 * ms-loop-mcp-server — local stdio server for Microsoft Loop
 *
 * No app registration required. Uses your existing Loop web session, the same
 * way msteams-mcp and msoutlook-mcp reuse the Teams and Outlook web sessions.
 *
 * Usage: node dist/index.js
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.server.connect(transport);
  logger.info('ms-loop-mcp-server running on stdio');
}

main().catch(err => {
  logger.error('Fatal error', err);
  process.exit(1);
});
