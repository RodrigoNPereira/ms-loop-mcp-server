# ms-loop-mcp-server

Unofficial local `stdio` MCP server for Microsoft Loop.

## What it can do

| Tool | Capability |
|------|------------|
| `loop_login` | Authenticate with a Microsoft 365 work or school account |
| `loop_status` | Show authentication and token status |
| `loop_logout` | Delete the locally stored Loop session |
| `loop_list_workspaces` | List accessible Loop workspaces |
| `loop_list_pages` | List the complete page tree in a workspace |
| `loop_get_page` | Read a page as Markdown or exported HTML |
| `loop_create_page` | Create a page from Markdown |
| `loop_update_page` | Rename, append, prepend, replace a section, or replace a page body |
| `loop_search` | Search Loop files through Microsoft Graph |
| `loop_create_workspace` | Create a shared workspace |

## Limitations

- Microsoft does not provide a public Loop content API. Page creation and
  updates use the undocumented API used by the Loop web client and may stop
  working if Microsoft changes it.
- Rich Fluid components, comments, live collaboration, cursors, and arbitrary
  component editing are not supported.
- HTML-to-Markdown conversion is lossy for interactive components.
- Page deletion is not currently exposed as an MCP tool.
- The server is single-user. Every operation runs with the permissions of the
  Microsoft account authenticated through `loop_login`.
- `loop_create_workspace` is less mature than the page operations.

## Requirements

- Node.js 20 or newer
- Chrome, Edge, or Playwright Chromium
- A Microsoft 365 work or school account with Loop access

## Install from npm

```json
{
  "mcpServers": {
    "loop": {
      "command": "npx",
      "args": ["-y", "ms-loop-mcp-server@latest"]
    }
  }
}
```

Restart the MCP client and invoke `loop_login`.

## Install from this repository

```bash
git clone https://github.com/vilsonrodrigues/ms-loop-mcp-server.git
cd ms-loop-mcp-server
npm ci
npm run build
```

This runs the server from a local build instead of the npm package.

## MCP configuration

Configure the MCP client to launch `dist/index.js` with Node. Use the absolute
path to your clone:

```json
{
  "mcpServers": {
    "loop": {
      "command": "node",
      "args": ["/absolute/path/to/ms-loop-mcp-server/dist/index.js"]
    }
  }
}
```

On Windows, escape backslashes in JSON:

```json
{
  "mcpServers": {
    "loop": {
      "command": "node",
      "args": ["C:\\Users\\you\\src\\ms-loop-mcp-server\\dist\\index.js"]
    }
  }
}
```

Restart the MCP client after changing the configuration.

## Authentication

Invoke `loop_login` from the MCP client. The first login opens a browser for
password and MFA. Token refresh is normally silent after that.

Session data is stored in `~/.msloop-mcp-server/` on macOS/Linux or
`%APPDATA%\msloop-mcp-server\` on Windows. The existing directory name is kept
for compatibility with sessions created before the project rename.

The stored session contains Microsoft bearer and refresh tokens. Do not share
it, commit it, or copy it to another machine. Use `loop_logout` to remove it.

## Remote execution over SSH

The server uses `stdio` only. It can run on another machine by transporting
stdio over SSH:

```json
{
  "mcpServers": {
    "loop": {
      "command": "ssh",
      "args": [
        "-T",
        "user@mcp-host",
        "node",
        "/opt/ms-loop-mcp-server/dist/index.js"
      ]
    }
  }
}
```

Run `loop_login` on the remote machine so its session is created there. The
remote shell must not print banners or other text to stdout, because stdout is
reserved for MCP messages.

## Updating

```bash
git pull --ff-only
npm ci
npm run build
```

Restart the MCP client after rebuilding.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MSLOOP_DEBUG=true` | Write diagnostic logs to stderr |
| `MSLOOP_BROWSER=chrome` | Select `chrome`, `msedge`, or Playwright's `chromium` |
| `MSLOOP_CHROME_PROFILE` | Select a Chrome profile directory, such as `Profile 1` |
| `MSLOOP_EDGE_PROFILE` | Select an Edge profile directory, such as `Profile 1` |
| `MSLOOP_SKIP_COOKIE_IMPORT=true` | Skip importing SSO cookies from the system browser |

## Development

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

## License and acknowledgements

MIT. See [LICENSE](./LICENSE).

The original implementation was created by Shayan Khaksar. Endpoint mapping
was informed by
[exec-astraea/loop-migration](https://github.com/exec-astraea/loop-migration)
and [Microsoft Loop under the hood](https://www.nicodecleyre.com/blog/2023-04-03-microsoft-loop-under-the-hood/).
