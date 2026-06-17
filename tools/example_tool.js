import { z } from 'zod';

/**
 * EXAMPLE TOOL — illustrates how tools connect to mcp-server-modular.
 *
 * Drop any .js file in this folder and the server auto-discovers it.
 * No registration, no code changes to the server required.
 *
 * Each tool exports a default object with three fields:
 *   name        — the tool identifier the AI calls
 *   description — what the AI sees when deciding which tool to use
 *   schema      — Zod schema; validated before your handler is ever called
 *   handler     — your logic; receives validated params + a context object
 *
 * Replace this file with your own tools. This one does nothing useful.
 */
export default {
  name: 'example_tool',
  description: 'Illustrative example — replace with your own tool.',

  // Zod schema: bad params are rejected before handler is called.
  schema: {
    message: z.string().describe('Any text input'),
    repeat: z.number().int().min(1).max(10).optional().describe('How many times to echo (1–10)'),
  },

  // handler receives ({ message, repeat }, ctx)
  // ctx exposes server utilities (logging, config, etc.)
  async handler({ message, repeat = 1 }, ctx) {
    const output = Array(repeat).fill(message).join('\n');

    // Always return { content: [{ type: 'text', text: '...' }] }
    return {
      content: [{ type: 'text', text: output }],
    };
  },
};
