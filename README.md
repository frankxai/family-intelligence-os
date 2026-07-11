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
- `packages/family-claims`: claim lifecycle and steward-only authority transitions.
- `packages/family-evidence`: source, rights, sensitivity, and publication checks.
- `packages/family-consent`: purpose-specific, revocable consent receipts.
- `packages/family-succession`: separate emergency, incapacity, and death release gates.
- `packages/family-gedcom`: deterministic GEDCOM 7 interoperability projection for already-approved export data.
- `packages/family-export`: encrypted export-manifest and scope/exclusion authorization contract.
- `packages/family-connectors`: adapter contract and manifest schema.
- `packages/family-mcp`: tool schemas, safe handlers, and sanitizers.
- `agent-packs/family-guardian-network`: Guardian, documentation, research, household, gathering, elder, contact, and personal-hub agent concept.

## Defaults

- Adapter-first; no upstream app code is vendored.
- Read-only connectors in MVP.
- Writes and exports are blocked or confirmation-required.
- Raw sensitive data should remain in family-owned systems.
- MCP is a controlled gateway, not an open tool buffet.
- Personal hubs are private-first; contributions to family or public libraries require approval and Guardian review.
- Family history enters as a claim, never as an accepted fact.
- Living people are private by default; children cannot enter the public archive.
- AI cannot accept claims, contact relatives, publish, verify death, or release access.
- An inactivity timer can never trigger succession.

## German portal

`/de/portal` is the German-first private surface. Production is locked until a real family-scoped session is wired. A synthetic zero-record preview is available only outside production when `FAMILY_PORTAL_DEMO=true`.

No real relative names or family records belong in repository fixtures. The UI demonstrates circles and review states with generic labels only.

## Reusable templates

- `templates/vercel-family-portal`: Vercel project settings and environment contract.
- `templates/v0-family-portal`: a safety-bounded v0 prompt and acceptance checklist.
- `vercel.json`: one-path monorepo build for `@family/web`.

## Local Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @family/web dev
```

## Deployment

The first deployment target is a Vercel preview for `apps/web`. Production promotion requires authentication, privacy, restore, accessibility, and audit review. See `templates/vercel-family-portal/README.md`.
