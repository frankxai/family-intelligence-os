# Agent Instructions

- Preserve adapter-first architecture.
- Do not vendor upstream applications.
- Do not add write-capable connector behavior unless policy, confirmation, audit, and rollback notes are implemented.
- Keep MCP tool descriptions short and non-manipulative.
- Add tests for every policy or connector behavior change.
- Do not rely on Next.js proxy as the sole authorization layer; re-check authorization in route handlers, server actions, and MCP handlers.

