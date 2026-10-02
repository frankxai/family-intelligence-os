# Agent Instructions

- Preserve adapter-first architecture.
- Do not vendor upstream applications.
- Do not add write-capable connector behavior unless policy, confirmation, audit, and rollback notes are implemented.
- Keep MCP tool descriptions short and non-manipulative.
- Add tests for every policy or connector behavior change.
- Do not rely on Next.js proxy as the sole authorization layer; re-check authorization in route handlers, server actions, and MCP handlers.


- Keep implemented, deployed and operating statuses distinct; never mark a runtime profile or workflow definition as a live adapter.
- Read docs/sovereign-family-workspace.md for identity, archive, implementor and interface boundaries.
- Preserve original sources, uncertainty and per-member memory. No private family fixtures, telemetry content or credential material in public code, plugins or skills.
- Do not enable autonomous family contact, child-agent messaging, identity merging, publication or succession release.
