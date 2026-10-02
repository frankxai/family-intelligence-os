# Family OS ↔ Library OS
Source inspected: frankxai/library-os README on 2026-10-02. Status: mapping contract, no private data adapter deployed.

| Library OS concept | Private Family OS representation |
| --- | --- |
| Book identity, author, edition | Private artifact + edition metadata |
| Chapter and page references | Immutable source coordinates on each chunk and note |
| Key insights | Original commentary drafts with source refs |
| Quotes | Verified excerpt + page + processing/publication rights |
| Related reading | Candidate links with evidence; no automatic truth assertion |
| Public review / JSON-LD / OG card | Separate human-approved sanitized projection |
| Photo/note capture | Quarantined source intake and private original |

Never expose the private index through public quote APIs, random-quote endpoints, sitemap, JSON-LD, preview deployments or analytics. Do not copy private reflections into BookReview fixtures.
The bridge accepts only an already-authorized scope from the family gateway. Library OS receives no archive master key and cannot resolve a family subject independently.
Import retains original ID, tenant, rights, consent/purpose references, edition/page, hash, provenance and derivative version. Export omits private source URLs, subject IDs and unapproved text.
Acceptance: a private scan never appears in public endpoints; a revoked consent suppresses derived chunks and notes; partial scans produce bounded field notes; a source-to-page link survives export/restore.
