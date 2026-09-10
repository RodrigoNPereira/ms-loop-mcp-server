/**
 * Minimal logger that writes to stderr so MCP stdout stays clean.
 */

const isDebug = process.env.MSLOOP_DEBUG === 'true';

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    process.stderr.write(`[ms-loop-mcp-server] ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
  },
  debug: (msg: string, ...args: unknown[]) => {
    if (!isDebug) return;
    process.stderr.write(`[ms-loop-mcp-server:debug] ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
  },
  warn: (msg: string, ...args: unknown[]) => {
    process.stderr.write(`[ms-loop-mcp-server:warn] ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
  },
  error: (msg: string, ...args: unknown[]) => {
    process.stderr.write(`[ms-loop-mcp-server:error] ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
  },
};
