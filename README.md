# mcp-server-modular

No-code tool loading for MCP. Drop a `.js` file in the `tools/` directory, restart the server, and your tool is live. No server code changes needed.

## Quick Start

```bash
git clone https://github.com/itamos-technologia/mcp-server-modular.git
cd mcp-server-modular
npm install
node server.js
```

Server starts on `http://localhost:3100/mcp`. Connect any MCP client to this URL.

## Creating a Tool

Create a `.js` file in `tools/` that exports:

```javascript
import { z } from 'zod';

export default {
  name: 'my_tool',
  description: 'What this tool does.',

  schema: {
    input: z.string().describe('The input parameter'),
    verbose: z.boolean().optional().describe('Show extra detail'),
  },

  async handler({ input, verbose = false }, ctx) {
    // Your logic here
    // ctx.run(cmd)          — execute shell command
    // ctx.runSafe(bin, args) — execute without shell (no injection risk)
    // ctx.esc(str)          — escape string for shell

    return {
      content: [{ type: 'text', text: `Result: ${input}` }]
    };
  },
};
```

That's it. Restart the server and your tool is available to any MCP client.

## Tool API

Every tool file must export an object with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique tool name |
| `description` | `string` | No | Shown to the LLM |
| `schema` | `object` | Yes | Zod schema for parameters |
| `handler` | `async function` | Yes | Receives `(args, ctx)` |

### Handler Context (`ctx`)

| Method | Description |
|--------|-------------|
| `ctx.run(cmd, timeout?)` | Execute shell command (returns stdout) |
| `ctx.runSafe(bin, args, timeout?)` | Execute without shell — no injection possible |
| `ctx.esc(str)` | Escape string for safe shell interpolation |

### Handler Return

Return an MCP content array:

```javascript
return {
  content: [
    { type: 'text', text: 'Your result here' }
  ]
};
```

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `MCP_PORT` | `3100` | Server port |

## Features

- **Hot-reload** — `fs.watch` on tools/ directory, new sessions pick up changes automatically
- **Lifecycle hooks** — tools can export `init(ctx)` and `cleanup(ctx)` functions
- **TypeScript detection** — warns about .ts files with helpful compile instructions
- **Error isolation** — broken tools are skipped, server keeps running

## Example Tools

- `tools/hello.js` — Simple greeting (template for new tools)
- `tools/run_command.js` — Shell command execution

## Architecture

```
server.js          — MCP transport + tool discovery + hot-reload
tools/             — Drop tools here
  hello.js         — Example tool
  run_command.js   — Example tool
  your_tool.js     — Your custom tool
```

The server scans `tools/` on startup, validates each file exports `name`, `schema`, and `handler`, and registers them with the MCP server. Schema validation is handled by Zod — invalid parameters are rejected before reaching your handler.

## More from Itamos

`mcp-server-modular` is the free, open-source foundation.

**[MCP Basic](https://itamos-technologia.com)** — the full production toolkit built on top:

- 📄 **Segment-based file editing** — read and edit code at 5× token savings with built-in verification
- 🌐 **Web page skeletonizer** — browse any page at up to 89% token compression
- 📧 **Universal mail client** — IMAP/SMTP with auto-detect for Gmail, Outlook, Yahoo, and more
- 📋 **Text offloader** — large pastes compressed to skeleton references (34× savings)
- 🧠 **Memory injection** — semantic search across conversation history, injected automatically
- 📊 **Token tracking dashboard** — per-tool breakdown, lifetime savings, cost avoided

**20M+ tokens saved and counting.**

→ [itamos-technologia.com](https://itamos-technologia.com)

## License

Apache 2.0 — see [LICENSE](LICENSE)

## Author

[Itamos Technologia](https://itamos-technologia.com)
