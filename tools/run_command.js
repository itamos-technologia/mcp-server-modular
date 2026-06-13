import { z } from 'zod';

export default {
  name: 'run_command',
  description: 'Execute a shell command and return the output.',

  schema: {
    command: z.string().describe('Shell command to execute'),
    timeout: z.number().optional().describe('Timeout in ms (default: 30000)'),
  },

  async handler({ command, timeout = 30000 }, ctx) {
    // Uses runSafe when possible, falls back to run for shell features
    const result = await ctx.run(command, timeout);
    return {
      content: [{ type: 'text', text: result }]
    };
  },
};
