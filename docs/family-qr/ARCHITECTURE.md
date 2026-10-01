# Starlight Family: QR doorways, knowledge and access

Status: bounded prototype and policy code. No production authentication, family records, provider connection, security monitoring or paid service has been activated.
Evidence checked: 2026-10-01. Canonical runtime: `frankxai/family-intelligence-os`. Doctrine remains in `frankxai/family-intelligence-systems`. Public fixtures are synthetic.

## Product decision

Build Starlight Family as the family module of the existing runtime. QR cards connect physical places to approved knowledge and useful actions. The repeated job is: a family member scans a card, signs in personally, finds a permitted source, understands the answer, and knows when to ask a human.

The first pilot is one household, three doorways (household, learning, values), one document collection for adults, and one account register. Do not begin with autonomous web agents, whole-browser recording or a universal credential proxy. Useful retrieval and recoverable ownership come first. Adoption and willingness to pay remain unvalidated.

## Doorways

| Location | Job | Destination | Grant rule |
|---|---|---|---|
| Kitchen | Find a recipe, routine or appliance guide | Household | Approved resource and explicit member grant |
| Study desk | Explore a lesson or learning question | Learning | Reviewed low-sensitivity material; adult-led use below provider minimum age |
| Family table | Discuss a value, story or tradition | Values | Human-authored, dated charter; room to question and revise |
| Document folder | Find a policy, warranty or letter | Documents | Adult account, explicit resource grant, source permissions |
| Photo collection, later | Hear the story behind an image | Memories | Consent and living-person/child impact review |

A printed code contains an opaque locator at a configured HTTPS origin: `/q/<locator>`. No family ID, personal name, password, session, signed storage URL, role or invitation is encoded. Production issuance uses a cryptographically secure random generator with at least 128 bits. Locators are non-secret even when random. Keep them out of analytics and redact access logs.

Invitation and pairing are separate workflows: single-use expiring challenge, specific account and purpose binding, server-side enrollment validation, and parent/steward approval where required. Do not print enrollment tokens on household cards.

Every scan resolves the current server record after verified sign-in. No grant comes from a photographed code. Same-family identity alone is insufficient: the record requires the member's explicit grant. Unknown, expired, revoked, malformed and unauthorized codes reveal the same generic response. Production responses require `Cache-Control: private, no-store`, a no-referrer policy, rate limits and no third-party pixels. `noindex` is not authorization.

`evaluateQrEntry` is a pure policy helper, not authentication and not a trusted authorization receipt. Server session and QR records must come from deployment-owned authoritative adapters. The `/q/[locator]` route deliberately stays locked until those adapters exist. Record/AI/tool handlers recheck authorization independently, including after revocation.

## Knowledge architecture

Authenticate → establish family/member → calculate allowed resource set → retrieve only permitted sources/chunks → answer with citations → authorize every source-open and tool action again.

Keep originals in private family-owned systems and use adapter-first integration. Source records carry owner, family/circle ACL, sensitivity, affected persons, consent purpose, rights, source URI, capture/version date, retention and deletion state. Embeddings, OCR, summaries and cached answers inherit the same ACL and deletion obligations. Never retrieve broadly and redact afterward; metadata and search snippets can leak too. Cache keys include tenant, member/grant version and resource version.

Start with approved manuals, household information and a human-authored charter. Health, legal, financial, credentials and other sensitive adult records stay in separate collections and are excluded from child learning. Unknown sensitivity blocks ingestion/retrieval. A child's approved story can be modeled later after consent review; the first QR helper intentionally permits only household/learning/values for children and teens.

An answer shows the source, date and uncertainty. Claims about family history require human review. The AI does not become the authority for family values, diagnoses, money movements or relationship decisions.

Teaching loop: ask what the learner already thinks → give a hint or small example → request an explanation in their own words → show evidence → stop or involve a trusted adult. No engagement-maximizing dependency, ideological scoring or personality profiling. Separate learning cards from private chat histories.

## AI accounts and provider boundary

The account register stores provider, owner, age/region eligibility review, policy check date, native parental-control setup, subscription owner/renewal, API budget owner and recovery reference. Store passwords, TOTP seeds, recovery codes, cookies and API keys in their appropriate secret/password manager; none goes into embeddings, the public repo, QR codes or model prompts.

Use personal consumer accounts. Parent/teen linking is the provider's native relationship. Current ChatGPT documentation permits selected controls and schedules, not parental access to a teen's transcripts or real-time activity; either side can unlink. Under 13, actual ChatGPT interaction must be conducted by an adult. Local minimum age and lawful consent requirements still need review. Other providers remain blocked until their own current policy and regional eligibility are reviewed.

`evaluateConsumerAiAccess` describes account-register eligibility only. `adult_led_only` blocks the child's independent account path; it is not permission to impersonate an adult or to deploy any child-facing API. API use is a distinct service with its own provider under-18 rules, privacy assessment, moderation, retention, tools and budgets. A ChatGPT subscription is not an API spending allowance. No undocumented consumer-account APIs or session-cookie automation.

The first pilot records configuration manually. Do not display a control as enforced merely because the register says it was configured. Evidence must distinguish proposed, configured, checked and enforced.

## Cloudflare, retrieval and attack resistance

Cloudflare Access protects entry; verify the Access JWT signature, issuer, audience, lifetime and trusted membership mapping at the origin. Strip untrusted identity headers and block direct origin access. Passkeys/MFA protect personal sign-in. Cloudflare does not replace application resource authorization.

Gateway DNS/HTTP policy can reduce exposure on enrolled devices. DNS filtering does not reveal or protect every conversation, URL path or downloaded file; devices off the enrolled path are not covered. Begin with malware/phishing category blocks and visible configuration. Remote Browser Isolation is a separate paid add-on in current documentation. It isolates active content; Cloudflare documents traffic decryption and log retention, so using content inspection changes the privacy boundary. Keep inspection limited and transparent rather than blanket interception of family chats.

Firecrawl/Apify are capture/adaptor tools, not identity, a password vault or a malware-proof trust service. Prefer official APIs, authorized exports and public pages you have rights to capture. Separate public research from authenticated private-family connectors. No passwords, private family document URLs or browser cookies are sent to public scraping services by default.

Fetching must resist SSRF: allow approved HTTPS hosts, block loopback/private/link-local and metadata destinations after DNS resolution, revalidate every redirect, enforce response/timeout/size limits and isolate parser execution. Downloads enter quarantine; extension checks alone are insufficient. Validate magic bytes, scan malware, reject executables/macros, and human-review uncertain results before indexing. Missing scan evidence blocks use.

Treat retrieved pages and files as untrusted data. Prompt-injection attempts cannot alter permissions, approve sharing, call credential tools or widen network egress. The model receives only narrow read-only tools and permitted context. Any later write requires specific human review, bounded audit and rollback. Preserve rate limits and upstream rules; getting blocked means stop or use an authorized API, not an evasion mechanism.

## Storage, recovery and family trust

Use private buckets/database rows under the owning family and enforce server-side authorization plus database policy. Raw confidential records are excluded from model calls unless a narrowly reviewed task requires them. Transport/encryption-at-rest are baseline controls; they do not imply end-to-end encryption. A server that processes plaintext for retrieval can read it. True end-to-end encrypted retrieval would require a different local/client trust model.

Choose an EU deployment and processing map, then verify each subprocess location, provider retention and transfer arrangements. Location alone is not a GDPR compliance claim. When relying on consent for an online service directly offered to a child, Dutch child-consent requirements need qualified review; family membership is not automatic lawful authority over everyone's data.

Separate ordinary shared knowledge, each person's private area and stewardship controls. Kinship, household membership, guardianship and access remain distinct. No private recording or surveillance by default. Show collected data and controls in language a child can understand. A parent is not automatically entitled to every adult's or teen's private record. Transparent safety escalation and legally required disclosure need a separate reviewed workflow.

Maintain at least one encrypted independent backup, a separately protected recovery key and a tested restore. Test lost-phone recovery without bypassing strong authentication. Deletion purges source/chunks/embeddings/cache and follows a documented backup expiry schedule; do not claim immediate deletion from immutable historical backups. Emergency access cannot be granted by a QR code or AI alone.

## Build order and acceptance

1. Connect verified identity and resource-level membership, with a persisted bounded audit sink. Test cross-family/cross-member denial, revocation and lost-device recovery.
2. Add server-owned QR records, rate limits and response headers. Test copied cards, open redirects, enumeration and stale sessions.
3. Import one approved household/values collection. Demonstrate permission-filtered, cited answers with no cross-member source leaks.
4. Add a reviewed adult document connector, quarantine/scan and export/restore. Prove unauthorized sources cannot enter context.
5. Add the manual account register and native parental-control setup evidence. Add API access only after separate under-18 and budget review.
6. Enroll one device in visible threat filtering; test coverage and explain which traffic remains outside it.

Pilot outcome: at least 8 of 10 predefined everyday questions answered correctly with accessible sources; zero unauthorized source/chunk disclosures in the test set; copied QR cannot authenticate; access removal takes effect on the next protected request; export restored to an independent environment. These are acceptance targets, not achieved results.

## Dated primary evidence

- [ChatGPT age and adult-led education guidance](https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages)
- [ChatGPT parental controls and privacy](https://help.openai.com/en/articles/12315553-managing-parental-controls-in-chatgpt)
- [Cloudflare Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
- [Cloudflare origin JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cloudflare Browser Isolation, plan/privacy boundary](https://developers.cloudflare.com/cloudflare-one/remote-browser-isolation/)
- [Firecrawl scrape capability](https://docs.firecrawl.dev/features/scrape)
- [Dutch AP: consent](https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/grondslag-toestemming)
- [GDPR text, Article 8](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)

Sources establish vendor/regulatory constraints, not proof of a functioning deployment. The product architecture and pilot targets are proposed engineering decisions.
