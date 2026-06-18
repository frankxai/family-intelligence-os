# Security

Family Intelligence OS treats family data as high-trust infrastructure.

## Required Controls

- No unauthenticated remote MCP.
- Static MCP tool allowlist.
- No dynamic untrusted tool loading.
- Output sanitization.
- Least privilege connector tokens.
- Tenant isolation by `familyId`.
- Audit success, blocked, failed, and confirmation-required actions.
- Credential, medical, legal, finance, child-data, export, and delete actions are high-risk.

## Reporting

Do not include secrets, raw documents, child data, passwords, or finance records in issues or logs. Report security concerns privately to the repository owner.

