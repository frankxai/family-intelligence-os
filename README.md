# Family Intelligence OS

Deployable runtime for the Family Intelligence System initiative.

This repo is the orchestration layer: Next.js portal, MCP gateway, connector contracts, policy engine, audit layer, and deployment scaffolding for self-hosted family infrastructure.

## Architecture

- `apps/web`: Next.js App Router portal for family overview, connectors, audit, and security posture.
- `apps/mcp-gateway`: controlled MCP gateway with static tool allowlist.
- `apps/admin`: placeholder internal admin surface.
- `packages/family-core`: domain roles, sensitivity, action, member, resource, and policy types.
- `packages/family-security`: deny-by-default policy engine.
- `packages/family-audit`: audit event types and writers.
- `packages/family-connectors`: adapter contract and manifest schema.
- `packages/family-mcp`: tool schemas, safe handlers, and sanitizers.

## Defaults

- Adapter-first; no upstream app code is vendored.
- Read-only connectors in MVP.
- Writes and exports are blocked or confirmation-required.
- Raw sensitive data should remain in family-owned systems.
- MCP is a controlled gateway, not an open tool buffet.

## Local Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @family/web dev
```

## Deployment

The first deployment target is a Vercel preview for `apps/web`. Production promotion requires separate review.

