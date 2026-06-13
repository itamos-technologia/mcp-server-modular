import { z } from 'zod';

export default {
  name: 'hello',
  description: 'A simple greeting tool — use this as a template for your own tools.',

  schema: {
    name: z.string().optional().describe('Name to greet (default: World)'),
    shout: z.boolean().optional().describe('UPPERCASE the greeting'),
  },

  async handler({ name = 'World', shout = false }, ctx) {
    let greeting = `Hello, ${name}! Welcome to mcp-server-modular.`;

    if (shout) greeting = greeting.toUpperCase();

    return {
      content: [{ type: 'text', text: greeting }]
    };
  },
};
