# Data and authorization kernel

The runtime stores family history as reviewable claims linked to evidence and consent. A family-scoped database session must set `app.family_id` before querying tenant tables; the first SQL migration enables row-level security on every new kernel table.

## Transaction boundary

1. An intake creates a quarantined case. It may later create quarantined claim drafts and evidence metadata, never an accepted claim.
2. Agents may normalize, compare, transcribe, and prepare a review packet.
3. An authorized human steward accepts, disputes, rejects, or leaves the claim unresolved.
4. Public release is a separate transaction requiring rights review, redaction, and active self-consent for every affected living adult.
5. Emergency, incapacity, and death releases use separate active policies. Death verification occurs outside the application; a guardian quorum and cooling period precede a final, scope-limited human release transaction.

`@family/gedcom` serializes only the records supplied by an authorization-aware export service. It does not decide which claims, people, sources, or relationships are eligible. The companion encrypted export must retain consent, disputes, policy, audit, and restore metadata that GEDCOM cannot represent.

`@family/intake` now provides the one-time token, quarantine state machine, baseline attachment policy, and human-only decision boundary. `@family/mcp` resolves tenant and actor identity from a trusted server binding; tool input cannot self-assign a role. The second migration adds identity, invitation, audit, intake, attachment, and tenant-isolation tables.

## Deliberate gaps

The repository does not yet provide a production session adapter, object-store upload adapter, malware scanner, mailbox transport, or configured audit-event repository. `DatabaseAuditWriter` accepts an injected repository but no production database credentials or connection are bundled. The UI therefore remains locked in production. These are release blockers, not optional enhancements.
