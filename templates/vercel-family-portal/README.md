# Family Intelligence Portal — Vercel blueprint

This blueprint deploys the monorepo's `@family/web` application without weakening the privacy defaults.

## Vercel project settings

- Repository root: repository root (do not select `apps/web`)
- Framework: Next.js
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @family/web build`
- Output directory: `apps/web/.next`
- Node.js: 20 or newer

The root `vercel.json` already carries these values. Preview deployments remain locked unless a real authentication provider is configured. Synthetic demo mode is development-only and is rejected by the access helper when `NODE_ENV=production`.

## Environment contract

Copy `template.env.example` into Vercel's environment-variable UI as key names only. Never commit values.

Before enabling `FAMILY_AUTH_CONFIGURED`, implement a real session adapter that produces a family-scoped actor context. The current German portal deliberately receives no session and therefore stays locked in production.

## One deploy path

Use Vercel's native Git integration or a CLI deployment, never both for the same commit. Start with a preview and promote only after privacy, accessibility, and restore checks pass.
