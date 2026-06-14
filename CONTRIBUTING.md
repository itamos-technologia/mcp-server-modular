# Contributing to mcp-server-modular

We welcome contributions! Here's how to get started.

## Quick Start

1. Fork the repo
2. Clone your fork
3. Create a branch: `git checkout -b my-feature`
4. Make your changes
5. Test: `node server.js` — verify tools load correctly
6. Commit: `git commit -m "Add my feature"`
7. Push: `git push origin my-feature`
8. Open a Pull Request

## Creating a Tool

The best way to contribute is by creating example tools. See `tools/hello.js` for the template.

Every tool needs:
- `name` — unique identifier
- `schema` — Zod schema for parameters
- `handler(args, ctx)` — async function that returns MCP content

## Guidelines

- Keep tools self-contained — one file, one tool
- Use `ctx.runSafe()` over `ctx.run()` when possible (no shell injection risk)
- Add parameter descriptions in your Zod schema (`.describe()`)
- Handle errors gracefully — return error text, don't throw

## Reporting Issues

Open an issue with:
- What you expected
- What happened
- Steps to reproduce
- Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
