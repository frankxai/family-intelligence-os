# Runtime adapter contracts
The family gateway owns authorization; runtime identity and native chat permissions are insufficient.
Each adapter must verify: exact runtime version, tenant binding, subject/audience token validation, source ACL filtering, revoked sessions, child-related scope, per-member memory isolation, non-custodial implementor role, output citations, budget/cancellation and redacted logs.
Profiles are contracts, not implemented data connectors. Example configs start disabled. Do not activate a synthetic identity in production.
LobeHub: configure the installed version's Better Auth OIDC integration; old NextAuth/Clerk setup instructions are historical. Pin the version and audit database/object-store permissions.
Open WebUI: configure OIDC, start unapproved users as pending, disable public signup and evaluate admin bypass/additive group grants. Never mount the archive filesystem or use a cross-member shared RAG collection.
Hermes: one isolated member/service identity per profile; explicit MCP tool include list; bound memory scope; no credential-sharing or automatic private skill learning into public packages.
OpenCode: implementor-only code workspace; private MCP tools denied until scoped capability tests pass. The example uses V2 config layout; installed V1 requires its own verified mapping.
ChatGPT Work: installed skills plus per-person connector authority; private tunnel is optional reachability. No shared family login.
Codex: public code worktree and scoped stdio gateway. A code-maintainer identity has no private archive access by default.
