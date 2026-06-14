// ── mcp-server-modular ──────────────────────────────────────────────
// No-code tool loading for MCP. Drop a .js file, get a tool.
// Apache 2.0 — https://github.com/itamos-technologia/mcp-server-modular
//
// Usage:
//   1. Create a tool file in ./tools/ (see tools/hello.js for example)
//   2. npm install
//   3. node server.js
//   4. Connect your MCP client to http://localhost:3100/mcp
// ────────────────────────────────────────────────────────────────────

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const PORT = parseInt(process.env.MCP_PORT || '3100', 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Shell helpers ────────────────────────────────────────────────────

// WARNING: run() passes through shell — use only when shell features needed.
async function run(cmd, timeout = 60000) {
  const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout });
  return stdout || stderr || 'Done';
}

// Shell-free execution — arguments passed directly to binary, no injection possible.
async function runSafe(bin, args, timeout = 60000) {
  const { stdout, stderr } = await execFileAsync(bin, args, { maxBuffer: 10 * 1024 * 1024, timeout });
  return stdout || stderr || 'Done';
}

// Safety-net escaping for legacy run() callers. Uses single quotes.
const esc = (s) => {
  if (!s) return "''";
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
};

// Shared context passed to every tool handler
const ctx = { run, runSafe, esc };

// ── Tool discovery ───────────────────────────────────────────────────
// Scans ./tools/ for .js files. Each must export:
//   { name, description, schema, handler(args, ctx) }
//
// Schema uses Zod — import { z } from 'zod' in your tool file.
// Handler receives validated args + ctx with { run, runSafe, esc }.

const transports = {};

// Track cleanup functions for tool lifecycle
const toolCleanups = [];
let toolVersion = 0;

async function loadTools(server) {
  const dir = path.join(__dirname, 'tools');

  if (!fs.existsSync(dir)) {
    console.log('[mcp] No tools/ directory found. Create one and add .js tool files.');
    return 0;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let loaded = 0;

  for (const file of files) {
    try {
      // Cache-busting for hot-reload: append version to force re-import
      const mod = await import(path.join(dir, file) + '?v=' + toolVersion);
      const tool = mod.default || mod;

      if (!tool.name || !tool.schema || !tool.handler) {
        console.warn(`[mcp] Skip ${file}: missing name, schema, or handler`);
        continue;
      }

      // Lifecycle: call init() if exported
      if (typeof tool.init === 'function') {
        try {
          await tool.init(ctx);
          console.log(`[mcp] Initialized: ${tool.name}`);
        } catch (e) {
          console.error(`[mcp] Init failed for ${tool.name}:`, e.message);
        }
      }

      // Lifecycle: track cleanup() for shutdown
      if (typeof tool.cleanup === 'function') {
        toolCleanups.push({ name: tool.name, fn: tool.cleanup });
      }

      server.tool(
        tool.name,
        tool.description || '',
        tool.schema,
        async (args) => {
          try {
            return await tool.handler(args, ctx);
          } catch (e) {
            return { content: [{ type: 'text', text: `Error in ${tool.name}: ${e.message}` }] };
          }
        }
      );

      loaded++;
      console.log(`[mcp] Loaded tool: ${tool.name} (${file})`);
    } catch (e) {
      console.error(`[mcp] Failed to load ${file}:`, e.message);
    }
  }

  // Warn about .ts files (TypeScript not yet supported natively)
  const tsFiles = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  if (tsFiles.length > 0) {
    console.warn(`[mcp] Found ${tsFiles.length} TypeScript files — compile to .js first or install tsx: npx tsx tools/your_tool.ts`);
  }

  return loaded;
}

// Hot-reload: watch tools/ for changes, bump version so next session picks up new code
const toolsDir = path.join(__dirname, 'tools');
if (fs.existsSync(toolsDir)) {
  fs.watch(toolsDir, (event, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    toolVersion++;
    console.log(`[mcp] Tool changed: ${filename} (v${toolVersion}) — new sessions will use updated code`);
  });
}{
  const dir = path.join(__dirname, 'tools');

  if (!fs.existsSync(dir)) {
    console.log('[mcp] No tools/ directory found. Create one and add .js tool files.');
    return 0;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let loaded = 0;

  for (const file of files) {
    try {
      const mod = await import(path.join(dir, file));
      const tool = mod.default || mod;

      if (!tool.name || !tool.schema || !tool.handler) {
        console.warn(`[mcp] Skip ${file}: missing name, schema, or handler`);
        continue;
      }

      server.tool(
        tool.name,
        tool.description || '',
        tool.schema,
        async (args) => {
          try {
            return await tool.handler(args, ctx);
          } catch (e) {
            return { content: [{ type: 'text', text: `Error in ${tool.name}: ${e.message}` }] };
          }
        }
      );

      loaded++;
      console.log(`[mcp] Loaded tool: ${tool.name} (${file})`);
    } catch (e) {
      console.error(`[mcp] Failed to load ${file}:`, e.message);
    }
  }

  return loaded;
}

// ── Create MCP server ────────────────────────────────────────────────

function createServer() {
  return new McpServer({
    name: 'mcp-server-modular',
    version: '1.0.0',
  });
}

const app = express();
app.use(express.json());

// MCP Streamable HTTP transport
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId && transports[sessionId]) {
    await transports[sessionId].handleRequest(req, res);
    return;
  }

  const server = createServer();
  await loadTools(server);

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
  transports[transport.sessionId] = transport;

  transport.on('close', () => {
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
  await transport.handleRequest(req, res);
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    return res.status(400).json({ error: 'No session. POST /mcp first.' });
  }
  await transports[sessionId].handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (sessionId && transports[sessionId]) {
    await transports[sessionId].handleRequest(req, res);
  }
  res.status(200).end();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[mcp-server-modular] Running on http://localhost:${PORT}/mcp`);
  console.log('[mcp-server-modular] Add tools to ./tools/ and restart.');
});

process.on('SIGINT', async () => {
  console.log('[mcp] Shutting down...');

  // Lifecycle: call cleanup() on all tools that registered one
  for (const { name, fn } of toolCleanups) {
    try {
      await fn(ctx);
      console.log(`[mcp] Cleaned up: ${name}`);
    } catch (e) {
      console.error(`[mcp] Cleanup failed for ${name}:`, e.message);
    }
  }

  for (const t of Object.values(transports)) {
    try { t.close(); } catch {}
  }
  process.exit(0);
});
