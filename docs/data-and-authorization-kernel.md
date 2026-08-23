# Data and authorization kernel

The runtime stores family history as reviewable claims linked to evidence and consent. A family-scoped database session must set `app.family_id` before querying tenant tables; the first SQL migration enables row-level security on every new kernel table.

## Transaction boundary

1. An intake creates a quarantined case. It may later create quarantined claim drafts and evidence metadata, never an accepted claim.
2. Agents may normalize, compare, transcribe, and prepare a review packet.
3. An authorized human steward accepts, disputes, rejects, or leaves the claim unresolved.
4. Public release is a separate transaction requiring rights review, redaction, and active self-consent for every affected living adult.
5. Jurisdiction evaluation resolves all plausibly applicable versioned packs. Missing, research-only, invalid, expired, conflicting, unsupported, or server-repository-unresolved activation receipts block; embedded receipt fields and caller-provided reference lists are never accepted as proof, and reviewed current packs still require a qualified-human decision.
6. Community-authority restrictions are evaluated independently and can be stricter than family consent or ordinary rights metadata.
7. Emergency, incapacity, and death releases use separate active policies. Death verification occurs outside the application; a guardian quorum and cooling period precede a final, scope-limited human release transaction.

`@family/gedcom` serializes only the records supplied by an authorization-aware export service. It does not decide which claims, people, sources, or relationships are eligible. The companion encrypted export must retain consent, disputes, policy, audit, and restore metadata that GEDCOM cannot represent.

`@family/intake` now provides the one-time token, quarantine state machine, baseline attachment policy, and human-only decision boundary. `@family/mcp` resolves tenant and actor identity from a trusted server binding; tool input cannot self-assign a role. The second migration adds identity, invitation, audit, intake, attachment, and tenant-isolation tables.

## Trusted authorization composition

Portable receipt references, booleans, agent IDs, scopes, and repository objects are declarations, not authority. The ordinary `@family/security` package intentionally exports no repository, issuer, resolver, or server constructor. Its resolver seam is non-exported and test-only until a sovereign deployment-owned authorization service and dependency boundary are independently reviewed. Request handlers and agents cannot bootstrap trust through package imports.

The ordinary `@family/security` entry point cannot resolve receipts. Downstream policy evaluators receive only opaque contexts and require them to be resolved and consumed once at the same authoritative operation timestamp. Consumption re-queries the deployment-owned authoritative repository and revalidates issuer, validity, and revocation before admission. Evaluators then verify exact tenant/family, authenticated actor, agent or human authority, operation, resource, scope, policy/version or payload digest, verification window, and operation-specific binding. Cached, reused, expired, later-revoked, or timestamp-mismatched contexts fail closed. Jurisdiction activation additionally binds pack ID, version, canonical digest, tenant, applicability, qualified reviewer, and authoritative-source references. A current reviewed pack still routes only to qualified-human review.

Audit persistence accepts only a small bounded scalar metadata allowlist. Succession and authorization windows use strict timezone-bearing RFC 3339 instants; malformed, date-only, timezone-less, future-issued, expired, or revoked evidence fails closed.

## Deliberate gaps

The repository now defines a vendor-neutral, deployment-owned session-adapter boundary. Adapter output is treated as untrusted: the runtime accepts only bounded, unexpired, family-scoped human sessions with an explicit assurance method, and adapter failures lock the portal. No provider implementation or credentials are bundled, so the UI remains locked in production. A production session adapter, account recovery flow, object-store upload adapter, malware scanner, mailbox transport, and configured audit-event repository remain release blockers, not optional enhancements. `DatabaseAuditWriter` accepts an injected repository but no production database credentials or connection are bundled.
