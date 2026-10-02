# Sovereign Family Workspace
Revision: 2026-10-02. Status: implemented template, draft contracts and deployment packaging; private runtime adapters are not yet operating.

## The product decision
Build a family-owned archive and evidence layer with interchangeable conversational interfaces. The premium promise is continuity: a family can change model, hosting, implementor and chat interface without losing originals, permissions, provenance or export.

The portal is a calm, responsive reading and curation home. The implementor works through a separate technical console. No real family records belong in the reusable public repositories.

## Repository responsibilities
| Repository | Responsibility |
| --- | --- |
| family-intelligence-os | Dashboard, capture canvas, policy kernel, MCP scaffold, graph draft validation, deployment and workflow packs |
| family-intelligence-systems | Canon, authority, ontology and adoption protocols |
| library-os | Reusable book schema and approved publishing patterns; optional projection only |
| family-history-atlas | Separate public history surface; do not copy private records |
| A private family tenant | Originals, private graph, consent, trustee policies and member-owned memory |

## Trust architecture
| Layer | Owns | Boundary |
| --- | --- | --- |
| Family identity | Individual OIDC identities, passkeys, membership, guardianship | OAuth login is authentication, not a family membership grant |
| Policy gateway | Resource/field/purpose grants, live revocation, step-up and audit | Re-check every request, including MCP, source download and embeddings |
| Archive | Encrypted originals, derivatives, fixity and retention | Family controls keys and storage; no vault credentials in model context |
| Knowledge | Claims, evidence, principles, lessons and scoped indexes | No inference promoted to accepted fact; edges do not grant access |
| Runtime | ChatGPT Work, Codex, LobeHub, Open WebUI, Hermes, OpenCode | Per-member conversation memory and purpose-bound access |
| Continuity | Offline recovery inventory and trustee process | Technical recovery does not establish death, incapacity or succession authority |

Recommended control plane: a family-owned OIDC provider such as Keycloak or another reviewed provider; PostgreSQL for authoritative records and grants; an S3-compatible family-owned object store for originals. Optional dedicated graph engines must consume policy-filtered projections. Do not introduce a second authority store through a graph database.

At-rest encryption protects disks and snapshots, not a compromised authorized server. End-to-end or envelope encryption can limit implementor access only when the decrypting client/worker and key custody are separately designed and tested. Do not market the current portal as end-to-end encrypted.

An implementor can deploy code, repair adapters and observe opaque health signals without being granted archive-reading or recovery-key authority. A host administrator can still tamper with a server; minimizing this requires a documented threat model, reproducible reviewed builds, client-side key boundaries and independent key custody. A role label alone is not cryptographic separation.

## Authentication and recovery
Use per-person identities with passkeys where supported. Require fresh step-up for permissions, exports, key operations and continuity release. Keep two hardware authenticators and an offline recovery plan under family-controlled custody.

Hardware wallets are an optional custody integration, not the default identity system. A signed challenge requires nonce, audience, expiry, replay defense and a server-side membership grant. Do not place keys, names, hashes of personal records or family relationships on chain. Never make crypto ownership a child's access prerequisite.

Choose a reviewed trustee quorum and tested threshold/envelope recovery design; do not implement home-made cryptography. Separate loss-of-device recovery, incapacity, emergency access and death-triggered succession. Scope each release, preserve evidence and record a human-reviewed decision.

## Interfaces and actual maturity
| Interface | Appropriate role | Delivered here | Still required |
| --- | --- | --- | --- |
| ChatGPT Work | Capture, research, source-linked family work | Portable skill/plugin pack and setup guide | Per-member OAuth remote MCP or private tunnel, approved processors and runtime tests |
| Codex | Maintain code and prepare reviews | AGENTS.md, skills and stdio MCP scaffold | Sovereign service identity; isolated implementation environment |
| LobeHub | Family-hosted conversational home | Adapter profile and OIDC design | Installed-version configuration, scoped gateway, retrieval and revocation tests |
| Open WebUI | Local models and family reading room | Adapter profile and SSO design | Pinned deployment; audit admin access and additive group grants |
| Hermes | Bounded research/curation worker | Disabled config with tool include list | Per-member process/memory isolation and deployment-owned authorization |
| OpenCode | Family implementor | Disabled MCP config and tool denies | Installed-version tests and a non-custodial implementation scope |

Do not share one family ChatGPT login or one AI memory across relatives. Platform account eligibility and guardian decisions still apply. A custom family interface must implement its own guardian model; a plugin does not turn adult tools into a child product.

## Proactive workflow design
A durable workflow runner creates a purpose-bound run receipt, resolves an authoritative capability for each operation, stages bounded work, and routes changes to human review. A coordinator cannot delegate more authority than it holds. Guardian review is a preparation/checking role, not a permission override.

Run receipt: opaque run ID, tenant, authenticated actor, workflow version, purpose, authorized resource refs, source versions, processor/model route, cost cap, idempotency key, expiry, cancellation state, result refs and human approval refs. Keep raw source text out of logs.

Private run authority must be deployed and independently reviewed. Definitions in workflows/ are not an executor. n8n's example is manual and inactive, emits a checklist, and has no data-fetch or messaging nodes. Before production, configure authenticated input, minimization, durable retries, cancellation, redacted traces and retention.

Use deterministic extraction and policy validation around model calls. Parallelize independent approved source reads; serialize identity decisions, writes, approvals and releases. Limit one bounded retry for extraction, escalate uncertainty instead of burning tokens.

## Book and document ingestion
1. Register the source and purpose; confirm ownership, rights and subject consent where applicable.
2. Store immutable encrypted original and hash. Quarantine before parsing; inspect actual file type, size and malware.
3. Isolated OCR worker produces page-indexed text, confidence, engine version and source mapping. Handwriting and low confidence go to review.
4. Index only authorized chunks. Authorization filters apply before candidate retrieval; private embeddings and OCR text remain private.
5. Produce page-cited field notes, candidate claims and original commentary. Partial pages do not justify a whole-book summary.
6. Human curates the private collection. Public excerpts go through a separate rights/consent/sanitization review.
7. Revocation and retention propagate to chunks, embeddings, summaries, caches and exports. Keep legally required audit metadata separate.

Reuse Library OS's book identity, edition, chapter and source-aware commentary patterns through a versioned adapter. Its quote APIs, SEO, OG cards and publication jobs must never ingest the private corpus. See library-bridge.md.

## Adoption and deployment
Template → scoped single-member pilot → restoration and revocation proof → household rollout → multigenerational continuity drill.

Vercel hosts the zero-record template and eventual authenticated portal. Railway or sovereign infrastructure can host private workers, databases and local model endpoints. Infrastructure creation is separate from activating family data. A one-click template is onboarding, not a claim that a protected vault already exists.

## Acceptance before private activation
Cross-tenant and cross-member denials; child-data public exclusion; source-level retrieval filtering; expired/revoked identity denial; consent-withdrawal index suppression; hostile document injection handling; restore from encrypted backup; implementor denied archive reads; bounded-cost cancellation; human-only sharing, identity acceptance and continuity release.

## Source register
Documentation reviewed 2026-10-02; configuration must be revalidated for the installed version:
- https://learn.chatgpt.com/docs/build-plugins
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/deploy/connect-chatgpt
- https://docs.openwebui.com/features/authentication-access/auth/sso/
- https://docs.openwebui.com/features/authentication-access/rbac/
- https://lobehub.com/docs/self-hosting/auth (current authentication direction: Better Auth; old NextAuth guides are legacy)
- https://opencode.ai/v2/docs/mcp-servers
- https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/mcp.md
- https://vercel.com/docs/deploy-button
- https://docs.railway.com/config-as-code/reference
- https://docs.railway.com/templates/publish-and-share
- https://www.w3.org/TR/prov-o/

License and redistribution rights must be checked against pinned upstream versions before bundled hosting or commercial distribution. This repository has no selected distribution license; plugin metadata intentionally makes no license claim.
