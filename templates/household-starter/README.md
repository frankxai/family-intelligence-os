# Starlight Family | Household Starter

Four responsive interfaces for a sample household. Together creates a daily schedule, Care tracks a synthetic routine and shares an optional availability check-in, and Play produces original downloadable SVG prints. Household reviews offered prints and displays the shared schedule. Data stays in browser storage. Anyone with access to that browser can try all four views. Changing the view simulates a different family member.

## Run

Use Node 20+ and a local static server. No dependency installation, model key or database is required.

```sh
npm test
npm run build
python3 -m http.server 8080 --directory public
```

Open http://localhost:8080. To try the full loop, add Games night in Together, open Household, then offer a print in Play and approve it in Household. Reset sample day clears the sample state. The local Python server is for development. The two host profiles include security headers.

## Create a founder-owned GitHub repository

Run this command from the starter directory in a checked-out release. It refuses an existing destination and copies an explicit manifest. Other OS code, Git history, environment files, private household records, and hosting links are excluded.

```sh
node founder.mjs ../my-household
cd ../my-household
npm test && npm run build
git init -b main
git add .
git commit -m "Start household workspace"
gh repo create my-household --private --source=. --remote=origin --push
```

This gives the founder a fresh repository in their own GitHub account. The last command requires their authenticated GitHub CLI. For a public distribution mirror, export these same files into a dedicated repository and enable GitHub's Template repository setting only on that clean default branch. Founders can then use “Use this template” and choose Private. When upgrading, export a pinned later release into a clean directory, diff and review it. The new repository has independent history.

## Choose a host

| Profile | Deployment |
| --- | --- |
| Vercel static | Import the new repository. Root is the repo root. Framework Other, output directory `public`, empty build/install commands. Settings are in `vercel.json`. Test the production URL with an unsigned browser. |
| Cloudflare Worker | Set the unique Worker name in `wrangler.jsonc`. Run `npm run build` and deploy with an authenticated Wrangler CLI, e.g. `wrangler deploy`. The reproducible module contains only six public assets, serves GET/HEAD, and uses no bindings. Each served request invokes the Worker. |
| Authenticated household | Keep the existing Next.js portal for member sessions. Call a Worker gateway server-to-server using a scoped identity. Apply membership, resource and purpose policy on every read/write. Live member data requires a separately reviewed deployment. |

An owner can change the masthead, CSS tokens, scene paths and the activity catalog in `public/`. Keep examples synthetic. The existing license applies only to this standalone starter directory. Store real schedules, health information, personal chats and credentials outside source control.

## Distribution

The starter is free under MIT, including commercial customization. Its demonstrations need no paid services. Household branding and the bundled field-print artwork can be replaced by the founder. The Starlight name and logo do not imply endorsement.

Private production needs a separate member identity per person, consent withdrawal, durable opaque audit, encrypted backup and tested restore. Start with scheduling between two adult test accounts in separate browsers. Medication notifications, wearable data, real family albums and private AI remain unconnected here.
