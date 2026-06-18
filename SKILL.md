# Family Intelligence OS Skill

Use this repo to build the deployable Family Intelligence runtime.

## Runtime Rules

1. Read-only first.
2. Deny unknown actions and unknown sensitivity.
3. Call the audit writer for every meaningful connector or MCP action.
4. Keep connector tokens scoped.
5. Keep raw sensitive data in family-owned systems by default.

