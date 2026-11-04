# Starlight Family | Release and production decision

The free starter answers a concrete question in five minutes. Can I plan a day with my household, keep my routine to myself, and let a child offer something they made for a grown-up to review? It runs this journey with synthetic values and no login. The member switcher is for trying each perspective on one device. Each origin has independent browser storage.

## Source of truth

| Surface | Responsibility |
| --- | --- |
| family-intelligence-os | Owns the reusable app, private template exporter and deployment contracts. The rest of the OS retains its existing license status. |
| family-intelligence-systems | Owns consent, guardian authority, export/restore and evidence doctrine. |
| Private household repository | Founder-owned branding, deployment configuration and policy references. Personal records live outside Git. |
| Existing Wurzelwerk deployment | Separate family tenant. Do not attach its Worker, D1 or records to the starter. |
| Figma | Four native editable screens with linked navigation. [Open the file](https://www.figma.com/design/EETiibgIFupio2odVKfVnA) |
| Refero references | Amie's time-first agenda and Remy's event confirmation informed the timeline and explicit sharing actions. All artwork is original. [Agenda](https://refero.design/screens/3bd81189-96a3-4821-867b-974d8d73f73c) · [Flow](https://refero.design/flows/9765) |

## Hosting

The public Vercel project and the dedicated Cloudflare Worker deliver the same six UI assets. Deploy either for the free starter. These origins do not sync with one another. The standard Vercel production alias is the user-facing entry point. Cloudflare has no database, queue, model, or private tenant binding in this release. The Worker packages assets inline for a reproducible direct upload. Evaluate native Workers Static Assets once traffic warrants changing delivery.

For the first real household, keep the existing Next.js portal on Vercel for per-member sessions. Use the existing family policy kernel from a server-controlled gateway, with scoped short-lived credentials between tiers. Keep authoritative membership, schedules and sharing grants in one family-owned PostgreSQL database per deployment or a separately validated tenant schema. Use private R2 for objects; issue expiring, purpose-bound reads only after checking live grants. Bind a separate tenant service in a separate environment. Wearable readings, medication status and chat transcripts never enter the coordinator's dashboard by default. Own the schema and export independently of either host.

A Cloudflare-only founder can start with the shipped Worker today. Later add the same gateway contract to the Worker and use the same authoritative store. Do not dual-write household state to Vercel and Cloudflare. Keep the free app accessible when a founder chooses a different host or ends a paid service.

## Editions to test

| Offer | Opening price hypothesis | What a buyer receives | Launch criterion |
| --- | --- | --- | --- |
| Household Starter | Free | Licensed source, original prints, four sample interfaces, transfer to a private repo, both host profiles | Download unpacks cleanly and passes tests |
| Founder Kit | €99 once | Brand presets, DE/EN copy, alternate household modules, deployment recipes and facilitator material | Deliver one complete paid pack and verify a clean install by another founder |
| Managed Household | €19 per household/month | Managed member access, shared scheduling, backup, restore and upgrades | Two live adult accounts, revocation and restore drill. Private AI requires separate opt-in and a metered allowance |
| Assisted launch | €490 once, pilot | Configure the founder's tenant and domain, train a coordinator, record a restore drill | Price one bounded installation and obtain a pilot commitment |

Prices are proposals. No catalog, billing integration or live checkout is included. Keep access control, data export, deletion and the right to leave available to every active household. Charge for maintained modules, operations and human time. Public reach can be measured with opt-in founder interviews and download totals without logging household actions.

## Next release decision

1. **Together first.** Two adult accounts in separate browsers share one appointment. One can revoke the other. Verify denies through direct API access, stale sessions, second-tenant IDs, cached reads and downloads. Retry the write without producing a duplicate. Restore the appointment from a backup into an isolated environment.
2. **Care second.** An adult activates their own reminders and chooses exactly which availability signal to share. Timezone, daylight saving, repeated deliveries, offline recovery and missed reminders need device tests. Pair a wearable for one explicit data type and prove revocation. The public sample cannot log real medication or dispatch reminders.
3. **Play and private AI.** Give each household member separate memory and keys. Ship guardian-reviewed sharing and deletion before any child-facing generation; add age-appropriate account eligibility, model controls and a spend cap. Keep the offline art studio as the fallback.
4. **Together extensions.** Albums use private originals, stripped metadata and expiring shares. Meals and shopping should reuse the active kitchen-journal work after its own review. Calendar imports require minimum scopes, event-level approval, deduplication, unlink and export.

A founder may administer hosting without permission to read family records. Onboard the first real household only after member identity, tenant separation, consent withdrawal, audit and recovery pass in its deployment.

## Release operations

Run the starter tests and build, then use `python3 scripts/package-household.py /tmp/household-starter-0.1.0.zip` from the OS root. Publish the ZIP to the Vercel public download path shown in the dashboard. The zip contains exactly the founder export. Deploy the web assets and header configuration using the starter's standalone Vercel project; deploy the matching Worker with the starter's Wrangler profile. This release uses explicit artifact uploads. Future changes require a new verified deployment on each supported origin. Never deploy the monorepo root as the static output.

For rollback, redeploy the prior immutable source release and matching download, or use Vercel rollback and the previous Worker version. For a first release without a prior version, remove the standalone public routing. No private data migration is involved.
