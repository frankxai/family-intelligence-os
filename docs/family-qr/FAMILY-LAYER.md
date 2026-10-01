# Starlight Family Layer and portable Family Kits

Decision proposal, 2026-10-01. This extends the QR prototype; it does not activate a connector, plugin, monitoring service or robot. The configuration templates are design records, not an installer or enforceable access policy.

## Product and repository boundary

Starlight Family is the portable family layer: information stewardship, access, curation, emergency readiness, learning experiences and continuity across interfaces. The public unit is a **Family Kit**: a versioned combination of templates, configuration choices, source references, agent workflow instructions, required connector capabilities and acceptance checks.

Retain the existing two repositories. `family-intelligence-systems` owns canonical doctrine, source/rights/consent protocols, agent definitions and upstream registries. `family-intelligence-os` owns deployed identity/policy enforcement, retrieval, dashboard and client adapters. Put kits under runtime templates while trialling them; promote accepted doctrine into the canonical repository through review. Isolate robot/UI experiments under their own adapter/package paths. Extract an independent physical-experiences repo only after it has a separately maintained API, device test matrix and release cadence. A new repository is not the initial solution.

Family data always stays in its owning private deployment/storage. Kits and source code are public-safe and synthetic. Starlight owns the product; reusable authoring/distribution can draw on GenCreator without moving family records into its systems. Published guidance can use FrankX's editorial surface. These are proposed portfolio mappings, not changes to the Registry or accepted business commitments.

## What the layer owns

| Owned contract | Minimum fields/behavior |
|---|---|
| Information asset | Opaque resource ID, owning family/member, original/source date, source/claim distinction, rights, sensitivity, audience ACL, consent purpose, review/expiry state |
| Contact directory | Contact owner's approved fields, purpose, source, verification date, stale/conflict state and specific audience |
| Family charter | Human author/steward, chosen values, concrete practices, revision date, open questions; no AI authority or moral scoring |
| Interface locator | QR/NFC/printed reference/device route mapped to the same resource; never a credential |
| Agent workflow | Inputs, narrow tools, useful output, citations, prohibited actions and human checkpoints |
| Capability adapter | Upstream/version, required scopes, secret reference, data flow, maturity, license review and fallback |
| Continuity plan | Existing provider legacy configuration, contact/recovery references, independent export, restore evidence and authorized human succession process |

Reuse existing core/policy/consent/evidence/intake/succession types rather than inventing a competing family graph. JSON kit configuration cannot override those contracts or mint trusted receipts. Family owner, household member, legal guardian, steward and trusted contact remain different relationships.

## Deployment choices

| Profile | Family decision | Start with | Operations responsibility |
|---|---|---|---|
| Everyday | Keep current apps | One approved source folder, existing contacts/calendar, password manager, Starlight portal + narrow adapters or authorized exports | Family owns accounts; named operator owns updates, recovery and API costs |
| Sovereign | Own the service/data stack | Nextcloud for files/contacts/calendar; Paperless-ngx when document OCR is needed; photo service only when photos are in scope | Family or chosen operator maintains security, backups and restore |
| Maker lab | Add local AI and physical interfaces | Reviewed Open WebUI/local models, Home Assistant tags/readers and a device adapter | A competent adult owns network isolation, app review, media policy and physical testing |

Everyday is the default. Adding all registry apps at once creates maintenance work before it proves value. Family configuration should choose audience, sources, offline needs, AI providers, allowed tools, budget owner, device capture and recovery responsibility. Show each capability as planned/configured/tested/enforced, with evidence, rather than a single misleading green switch.

## Reuse versus build

Reuse files/calendar/contacts through documented APIs and standard export formats; Nextcloud documents WebDAV/CardDAV/CalDAV surfaces. Paperless-ngx documents a REST API and document permissions. Use those permissions as well as Starlight's, with narrow read-only identity; an upstream admin token cannot be assumed safe for member-specific search.

Keep credentials in an established password manager. Bitwarden already provides trusted emergency-contact workflows. Its wait-time release is a provider-specific behavior, not proof of incapacity/death and not permission for Starlight to release unrelated archives. Use approved provider mechanisms for digital legacy, including Apple Legacy Contact and Google Inactive Account Manager where relevant. Their conditions and eligible data differ; a QR code cannot replace them.

Use Immich as an optional photo/archive service through reviewed adapters. Its database backup does not include the original photos/videos; recovery must include media and database. Do not rebuild password storage, OCR, a photo server, calendar synchronization, robot firmware or consumer AI-account administration.

Build the parts that compound: permission-filtered retrieval and citations, a curation inbox, stale-contact/review indicators, versioned emergency packet preparation, interface-independent locators, compatible kit packaging, capability/release evidence, and tested export/restore. Keep a small, read-only family API. The proposed MCP tool set is `search_permitted_resources`, `open_permitted_source`, `list_approved_contacts`, `read_approved_learning_card` and `draft_emergency_checklist`. Each tool derives family/member identity from verified authorization and rechecks its specific resource. A schema or prompt is never authorization.

## Host adapters and plugin portability

There are three separate deliverables: portable instructions/templates, an authenticated family data/tool gateway, and host-specific plugin packaging. A shared MCP gateway does not make all hosts identical or guarantee every host supports the same skill format.

| Interface | Proposed connection | Constraint |
|---|---|---|
| ChatGPT/Codex | Reviewed plugin package with skills and/or authenticated MCP | Official plugin docs support both; private records require per-user OAuth/resource-server checks; availability and directory review still apply |
| Claude | Custom remote MCP connector and native instruction/skill wrapper | Remote connectors run from Anthropic infrastructure; consumer accounts require 18+ |
| Open WebUI | Native Streamable HTTP MCP with per-user OAuth, or reviewed OpenAPI adapter | MCP configuration is admin-managed; arbitrary community Python plugins run code; local UI does not mean cloud model inference is local |
| Other/local hosts | Adapter to documented MCP/OpenAPI/local files | No support claim until identity, transport, scopes, citation display and revocation tests pass |
| Lopap | Unresolved host name | Several similarly named products exist; keep it unbound until the exact product and supported API are established |

Use an established OAuth/identity provider; implement the family-specific authorization mapping and resource checks ourselves. Shared bearer tokens or caller-supplied family/role headers are not a portable identity solution. Cloudflare Access protects appropriate web surfaces but does not replace host-to-MCP user authorization. A custom chatbot shell does not create a right to automate someone else's consumer session.

Cloud AI hosts receive the tool outputs and context returned to them. Minimum necessary disclosure is an explicit family decision. Run particularly private workflows in an appropriately reviewed local path or exclude them from AI entirely. Export local context into a remote chat only after scoped approval.

Existing canonical skills already cover emergency preparation, elder-story capture, record evidence, consent, succession drills and conflicting claims. Reuse and test them rather than duplicating their governance in a giant family prompt. New teaching/curation instructions should remain thin wrappers over source/consent/policy contracts.

## Emergency and legacy

Routine emergency contacts must be deliberately pre-authorized, stored locally and printable. They cannot depend solely on AI generation, Internet connectivity or a freshly issued login. Produce a minimal card with a trusted contact, backup contact, relevant local service information supplied by an adult, last-verified date and a human-readable fallback. Verify numbers from actual people/services; do not generate contact details. Keep passwords, access keys, medical dossiers and the full directory off public cards and tags.

Sensitive emergency release, incapacity and death remain separate succession workflows with authoritative evidence and human approval. Do not treat inactivity as verified death. Online emergency packets have their own recipient scope, expiry and access log. A cached/printed contact card cannot be remotely revoked; track issued copies and replacement/destruction procedures.

Legacy records need durable identifiers, descriptive labels, original media plus portable derivatives, original/source/rights metadata and clear successor responsibilities. Put the family's own stable URL in QR/NFC, not an expiring storage URL or vendor shortlink. Print the readable reference alongside it. A later exporter must produce an offline index and relative links so the archive remains usable after Starlight or the domain disappears. Generic access-controlled entry and deliberately released offline copies are different lifecycle states.

## Curation as a family practice

Capture the original → distinguish evidence, recollection and AI summary → select an audience → check rights/consent → approve a useful entry → review staleness and recovery. Agents can draft metadata, detect duplicates, suggest questions, propose categories and flag uncertainty. Humans choose publication, values, sensitive claims, contact sharing and deletion.

A small weekly review can examine one useful source, one unresolved claim and one item to remove. The child-friendly practice is: Where did this come from? What supports it? Who may see it? What should stay private? What changed? Frequency is a proposed routine, not a created automation or validated learning intervention.

## Physical experiences

Use one interface locator contract for QR and NFC. NDEF URL tags can open a configured entry URL; Home Assistant already supports tags, readers and media actions. Test actual devices and OS reading behavior. Tag IDs can be copied and a scanner-device ID is not a person's identity. Locking tag writes can reduce accidental editing but does not make it an access credential. Printing and sticking a tag is not enrollment.

| Experience stage | Proposed experience | Information boundary |
|---|---|---|
| Youngest | Adult-led picture/story cards, tactile objects and recorded approved audio | No independent open-ended AI account, persistent microphone or biometric profile |
| Early years, device-rated 3+ | Button-programmed Bee-Bot/Blue-Bot activity on a map or story mat | Purposeful sequencing/play; manufacturer age rating and supervision apply |
| School-age | QR source trails, a family-history map, NFC story/music cards and permission lessons | Curated approved sources, bounded child session and visible saving rules |
| Older learner/adult maker | Supervised Reachy Mini experience authored as a reviewed app | Temporary sensor use, bounded outputs/movement, no access to general family secrets |

These stages are product-design proposals, not a scientific claim that robots improve development. TTS labels its cited Bee-Bot/Blue-Bot pack as suitable for 3+. Reachy Mini's official documentation presents it for hackers/AI builders and exposes SDK/daemon control. Its software motion clamping prevents certain self-collisions/damage; it does not establish child safety certification. Review the exact device's mechanical/electrical safety, supervision needs, pinch/small-part hazards and approved age before a family pilot.

Build a device gateway that can request approved content and bounded actions. A general language model must not have raw motor/network/filesystem authority. Parent stop/disconnect, visible capture indicators, sensor defaults, volume/motion bounds, stable placement and failure behavior need real-device testing. Keep robot control on a protected local segment; do not publicly expose its daemon. A sensor sample is temporary input unless a specific recording purpose is approved. Hardware claims require hardware evidence; no such testing has been completed here.

Develop the first Reachy experience in simulation, then an adult-operated device lab, then a supervised family pilot. Prototype learning content and NFC audio experiences before building custom electronics. Selling an own-brand connected toy changes product-safety, cybersecurity, privacy, warranty and support responsibilities; OEM certification is not automatically a certificate for a modified system.

## Public value and capture

The free public baseline should be useful without Starlight hosting: family charter, curation cards, contact review template, minimal emergency card, source inventory, QR/NFC guidance, portable exports, agent workflows and synthetic reference examples. Publish limitations and compatibility evidence. Never collect real family records as public contribution fixtures or train across families by default.

Proposed licensing direction: permissive licensing for our original code/specifications, CC BY for our original guides, third-party rights retained, optional trademark/compatibility governance. This is a proposal; it does not assign a license, certify a third-party component or change either repository's licensing. Open WebUI's current branding/redistribution terms require specific review before any commercial rebrand. API integration is preferable to vendoring but does not erase upstream obligations.

Value capture should pay for maintained convenience: reviewed premium activity/legacy packs, guided self-serve onboarding, managed updates/backups/restore, compatibility maintenance and optional support. Core emergency contact access, data export and family ownership should remain usable without a subscription. No behavioral advertising or sale of child/family data. Hardware affiliate links require clear disclosure and compatibility/safety review; do not make hardware the initial business dependency.

Illustrative offer hypotheses, not launched or validated: free Starter Kit; EUR 29–99 one-time maintained premium kit; EUR 15–30/household/month optional managed layer. Amounts are before tax and exclude hardware and separately billed model usage. No checkout, refund promise or paid offer has been created. Confirm rights, support scope, ownership and commercial terms before sale.

At a hypothetical EUR 20/month and 75% gross margin, variable cost must be no more than EUR 5/month. Ten minutes of support at an assumed EUR 60/hour costs EUR 10 alone. Self-serve onboarding, narrow adapters, explicit model budgets and separately priced support are necessary. Hosting margins need proof before managed service expansion.

## First falsifiable pilot

Buyer/operator hypothesis: an adult steward in a family with scattered documents and a dependent child or older relative. Repeated job: retrieve the correct, permitted, current information and maintain an emergency/continuity fallback. Current workaround: disconnected folders, chats, phone contacts and memory. No interview or willingness-to-pay evidence has been gathered in this turn.

Run a proposed 14-day pilot with five volunteering households, three QR/NFC destinations each, one contact card, one approved collection, a charter and ten predefined lookup tasks. Exclude new child-facing generative API/robot deployment from this first pilot. At least four households should maintain the kit independently, at least eight of ten lookups per household should return the correct permitted source, median completion time should improve versus that household's recorded baseline, contact retrieval must work offline, and zero unauthorized disclosure is acceptable. Restore one exported collection on an independent device. Record age/consent requirements and only minimum evaluation data.

Then test a clearly scoped paid premium kit or managed-service reservation after participants have used the free system. Actual paid uptake and support minutes establish commercial evidence; compliments do not. Stop expansion on unauthorized disclosure, untested recovery, provider-policy conflict or support economics above the declared cost ceiling. These are proposed experiments and acceptance targets, not achieved outcomes or scheduled outreach.

## Dated primary sources

- OpenAI plugin packaging: https://developers.openai.com/plugins/deploy/submission
- OpenAI MCP authentication: https://developers.openai.com/plugins/build/auth
- Claude remote connector: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Claude minimum age: https://support.claude.com/en/articles/13117299-minimum-age-requirement-access-restriction
- Open WebUI native MCP: https://docs.openwebui.com/features/extensibility/mcp/
- Open WebUI license: https://docs.openwebui.com/license/
- Nextcloud DAV: https://docs.nextcloud.com/server/stable/admin_manual/issues/general_troubleshooting.html
- Paperless-ngx API: https://docs.paperless-ngx.com/api/
- Immich backup requirements: https://docs.immich.app/overview/quick-start
- Home Assistant tags: https://www.home-assistant.io/integrations/tag/
- Bitwarden emergency access: https://bitwarden.com/help/emergency-access/
- Apple Legacy Contact: https://support.apple.com/en-us/102631
- Google Inactive Account Manager: https://support.google.com/accounts/answer/3036546
- Reachy Mini purpose/interfaces: https://huggingface.co/docs/reachy_mini/en/index
- Reachy motion limits: https://huggingface.co/docs/reachy_mini/en/SDK/core-concept
- TTS age rating: https://www.tts-group.co.uk/tts-bee-bot-and-blue-bot-programmable-robot-classroom-pack/1013162.html
- EU toy safety overview: https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en

Vendor documentation establishes capabilities/constraints, not reviewed deployment behavior or scientific learning outcomes. Sources were checked on 2026-10-01; exact supported versions/terms require review at installation and before sale.
