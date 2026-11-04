# Kitchen Notes — isolated cooking pilot

A private recipe and cooking-journal app with a small, deliberate publication surface. Runs independently of the locked Family OS vault. This deployment does **not** establish family membership, private-vault acceptance, guardian workflows, child access, medical suitability, or cryptographic separation from the hosting administrator.

## Working surface

- App: https://starlight-kitchen.vercel.app/
- Onboarding + copyable ChatGPT instructions: https://starlight-kitchen.vercel.app/start
- Portable guide: https://starlight-kitchen.vercel.app/guide.md
- Public read-only MCP: https://starlight-kitchen.frankxai.workers.dev/mcp

One-use, expiring invitations create separate notebooks. Each person receives a random 256-bit recovery/access key, stored server-side only as a SHA-256 digest. Secure HttpOnly SameSite=Strict session cookies expire after 30 days. This is an invitation-only cooking pilot, not a general identity provider; email recovery and passkeys remain a release gate for wider rollout. Never commit invitation links, keys, real recipes, health constraints or photos.

Recipes preserve source notes and immutable saved versions. Cooking sessions are separately dated. Foods store source, state and per-100g values. Recipe calculations require explicit food matching and gram weights; missing ingredients or nutrient fields do not become zero. Photos use private R2 keys scoped to notebook ID; browsers re-encode supported raster files to JPEG and strip metadata. These are resized derivatives, not archival originals. Individual public recipes have server-rendered `/r/<id>` pages, canonical URLs and escaped Recipe JSON-LD. Public copies are snapshots with a positive field allowlist and selected attached photos; private edits do not update them automatically.

Publication is a dedicated UI review action, requires the current recipe version, a rights confirmation and the notebook key. Public MCP has no write or private-read tool. Imports and AI drafts cannot set publication state. No social account is connected. Tumblr JSON is a draft payload, YouTube output is description/story text, and print produces a recipe card for PDF export. This pilot does not upload video or post YouTube Community content.

## Runtime

| Component                                    | Deployed responsibility                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel `starlight-kitchen`                   | Static responsive UI; same-origin rewrites to the Worker                                                                                                                 |
| Worker `starlight-kitchen`                   | Authorization on every private route; API, exports, AI draft boundary, public MCP                                                                                        |
| D1 `starlight-kitchen`                       | EU-jurisdiction database; profiles, sessions, invitations, recipes, versions, journal, foods, photos, publication snapshots, audit metadata, rate limits, AI quotas/runs |
| Existing `starlight-media-private` R2 bucket | `kitchen/<profile-id>/<photo-id>.jpg` only; no public bucket access enabled                                                                                              |
| Workers AI                                   | Llama 4 Scout; text-only recipe drafts with explicit processing consent, no tool calls                                                                                   |

D1 jurisdiction does not establish end-to-end EU residency for Vercel, existing R2, model processing or every request. No broad residency or end-to-end encryption claim is made.

AI: maximum 6,000 input characters; maximum 1,200 output tokens; one model call with no automatic retry; 10 requests/notebook/UTC day and 100 globally/day. Failed attempts consume allowance. Metadata records model, status, usage counts and run ID without raw notes. The AI output is validated, assigned draft status, stripped of food mappings, and returned unsaved for human review. The user's exact input replaces any model-authored source note.

## Development

Requires Node 22.13+ (built-in SQLite) or Node 24. No new runtime npm dependencies.

```sh
node --test apps/kitchen/test/*.test.mjs
node apps/kitchen/build.mjs
```

`worker-bundle.mjs` embeds the public UI for the direct Worker fallback. It is generated and ignored. `vercel.json` belongs to this standalone app; the repository's existing portal deployment is unchanged. The workspace lockfile includes the dependency-free importer and the existing CI runs the pilot tests.

### Deployment contract

1. Apply `schema.sql` to the isolated kitchen D1 database; do not reuse the family-vault schema.
2. Build the Worker and bind `DB` (D1), `MEDIA` (private R2), `AI` (Workers AI) and `ALLOWED_ORIGINS` (exact production UI and Worker origins).
3. Upload as a module Worker. Disable invocation logging containing request bodies or secrets. Current deployment has observability disabled.
4. Deploy `public/*` and `vercel.json` from this directory to the kitchen Vercel project. Do not point the Family OS portal project at this directory.
5. Mint invitations outside source control; store only SHA-256 digest and expiry in D1. Deliver separate one-time invitation links privately. Link fragment is cleared immediately by the app and never sent as the page URL.
6. Run synthetic isolation, storage, model and export verification. Delete synthetic rows and objects after the run.

## Audit, rollback and limits

Audit records include only profile ID, action, resource ID and timestamp. Version history and public snapshots preserve review boundaries. Optimistic concurrency rejects stale saves. Every dynamic SQL value is parameterized. Every private read/write re-resolves the session and checks notebook ownership. Cross-origin writes fail closed. Request and upload sizes are bounded. Response CSP blocks inline JavaScript and external resources; all user-supplied HTML is escaped.

Rollback: retain the prior Vercel deployment and Worker version, redeploy the previous reviewed source, and leave D1/R2 in place. Initial schema is additive. Do not drop the database to roll back UI code. Disabling the AI binding or route removes generation while capture/import continues. Disable public ingress and revoke sessions if isolation is in doubt. Delete a recipe only through its authenticated action; it clears its public snapshot and photos, while dated journal notes remain detached. R2 and D1 cannot form one transaction: an R2 deletion failure after DB deletion can leave an unreachable orphan; a later scoped reconciliation job is still needed. Never broaden bucket permissions to resolve an upload problem.

Limits: 500 recipes, 500 immutable food source snapshots, 200 photos per notebook; 5 MB JPEG after conversion. Latest 1,000 journal entries shown; all included in export. Food corrections should be entered as a new source snapshot and rematched. Export JSON contains photo references/hashes, with separate JPEG downloads; an automatic restore importer and offsite backup are not shipped. Losing the notebook key currently requires host-admin assistance, with no automatic recovery flow.

The JPEG endpoint validates type signature/size, not malware or full decoder validity. The browser creates a fresh raster JPEG. No server OCR/parser executes uploads. This is not the family archive's quarantine/scanning pipeline and must not be used for documents, arbitrary uploads, children or medical records.

## Next release gates

1. Passkeys or reviewed OIDC, invitation administration, session/key revocation, per-person consent, account deletion and tested export/restore before broader invitations.
2. FoodData Central API search/import with a server-held API key, stable source IDs, units and raw/cooked matching; keep source dataset/licence boundaries explicit. No fabricated universal nutrition database.
3. Per-member OAuth MCP: scoped search/read and draft-creation tools, fresh access checks, revocation and audit. Keep publication outside agent authority. Test actual ChatGPT client compatibility before claiming a connected private app.
4. Tumblr OAuth draft adapter with idempotency and explicit publish confirmation. Other blogs use a canonical Recipe JSON-LD/Markdown adapter. YouTube upload is a separate optional video workflow; no promise of a general text-post API.
5. Opt-in proactive cooking missions: choose from the person's own recipes and confirmed pantry, propose a bounded plan, stage a grocery draft, record cost/usage and wait for review. Schedules, notifications and purchases are not enabled.
6. Public chef profiles, editorial provenance/rights review, moderation, source/licence handling and abuse controls before open self-signup or paid public access.

## Primary references checked 2026-11-04

- D1 transactions: https://developers.cloudflare.com/d1/worker-api/d1-database/
- Workers bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/
- Deployed model and prices: https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/
- FoodData Central API / public-domain data: https://fdc.nal.usda.gov/api-guide/
- Tumblr NPF: https://github.com/tumblr/docs/blob/master/npf-spec.md
- MCP compatibility contract: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-03-26/basic/transports.mdx

The MCP server is a bounded legacy-compatible JSON-response implementation negotiating 2025-03-26 / 2025-06-18 / 2025-11-25. It does not claim compliance with the newer 2026 transport, OAuth/private-client support, streaming or marketplace certification.
