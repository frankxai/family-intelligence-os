---
name: genealogy-research
description: Plan and conduct evidence-led family-history research, analyze historical records, correlate identity and kinship claims, document citations and negative searches, and audit GEDCOM files. Use for real genealogy investigations and research artifacts, not generic family-app development.
---

# Genealogy Research

Treat genealogy as claim-centered historical research. A tree entry, index hit, user recollection, or AI extraction is a lead until its provenance and evidence have been evaluated.

## Route the request

- For a new ancestor, relationship, or event question, use **Research planning and execution**.
- For conflicting identities, dates, places, or kinship links, use **Evidence analysis**.
- For scans, photographs, certificates, registers, letters, or handwriting, read [references/document-analysis.md](references/document-analysis.md).
- For citations, logs, evidence ledgers, or proof narratives, read [references/citations-and-outputs.md](references/citations-and-outputs.md).
- For a `.ged` file, GEDCOM conversion, or family-tree interchange, read [references/gedcom.md](references/gedcom.md). Use `scripts/gedcom_audit.py` for a read-only structural and privacy audit.
- For DNA evidence or genetic relationship questions, read both [references/dna-evidence.md](references/dna-evidence.md) and [references/privacy-and-ethics.md](references/privacy-and-ethics.md) before analysis.
- For adoption, unknown parentage, living people, contact, publication, community-restricted knowledge, or online-tree changes, read [references/privacy-and-ethics.md](references/privacy-and-ethics.md) before acting.
- For archive and database discovery, read [references/source-discovery.md](references/source-discovery.md).
- Before finalizing a substantial research report, proof summary, or completed evidence audit, read [references/quality-gates.md](references/quality-gates.md).

## Research planning and execution

1. Frame one answerable question. Identify the subject, relationship or event, approximate period, relevant places and jurisdictions, and the desired proof threshold.
2. Inventory what is known, where each assertion came from, what has already been searched, and the unresolved conflicts. Do not make the user repeat supplied context.
3. Form a proportionate plan before searching: prioritize sources likely to identify the person or answer the relationship, then collateral/FAN sources, boundary changes, and unindexed material. A compact internal plan is enough when the user already asked for execution.
4. Search only within the user's requested scope. Read-only public research is allowed when requested or clearly part of the task. Log database, collection, query variants, date, coverage, result, and access limitations.
5. Capture provenance with the finding. Prefer an original image or archival reference over an index; preserve the index as a finding aid and record the path from database entry to underlying record.
6. Convert each finding into atomic claims, correlate them, test competing identities, explain conflicts, and identify what would falsify the leading hypothesis.
7. Conclude at the level the evidence supports. Distinguish a GPS-aligned conclusion from a working hypothesis, research lead, or unresolved conflict.

Use [references/research-method.md](references/research-method.md) for the evidence model and standards.

## Evidence analysis

For every material claim, record:

- the exact assertion and subject;
- source, repository/database, locator, URL if applicable, access date, and image/page/item;
- source type: original, derivative, or authored;
- information type: primary, secondary, or undetermined, assessed per assertion;
- evidence type: direct, indirect, or negative;
- informant, timing, likely knowledge, and possible bias;
- independence from other evidence;
- conflicts, alternative explanations, and remaining tests.

Do not use source counts as a shortcut. Two websites that reproduce one register entry are one evidentiary origin. Conversely, a network of independent indirect evidence can be stronger than one direct statement. “Not found” becomes negative evidence only when the record should exist, the collection coverage is understood, and the search was adequate.

Use claim statuses such as `lead`, `supported`, `strongly_supported`, `contradicted`, and `unresolved`. Do not present a confidence percentage unless the user supplies a defined scoring model. Never silently promote an agent-produced conclusion into an accepted family fact.

## Identity resolution

Compare whole identity patterns, not names alone: age, dates, places, relatives, associates, neighbors, occupation, religion, language, migration, property, witnesses, signatures, and record chronology. Track name variants without overwriting the recorded form. Keep competing-person hypotheses separate until conflicts are resolved.

## Safety and authority

- Living people, minors, DNA data, contact details, adoption, donor conception, and unexpected parentage are sensitive by default.
- Minimize or redact sensitive data before external tools or searches. Prefer local analysis of user-provided files.
- Do not contact relatives, purchase records, use credentials, alter online trees, merge identities, publish findings, or upload private documents unless the user explicitly requests that action. Require a just-in-time confirmation before an irreversible or externally visible change.
- Preserve originals. For any requested GEDCOM or vault rewrite, create a new file or backup, report the diff, and provide rollback notes.
- Never invent a citation, repository call number, record identifier, transcription, translation, date, relationship, or search result. Mark unreadable text and inaccessible sources plainly.
- Treat AI-restored, colorized, reconstructed, or generated historical images as illustrations rather than identity, date, or place evidence. Preserve the original and disclose the alteration.

## Deliverables

Choose the smallest useful artifact. Templates are available in `assets/templates/` for a research plan, research log, evidence ledger, and proof summary. Adapt them to the project rather than filling fields mechanically.

End substantial work with:

- conclusions and their status;
- evidence that supports and challenges each conclusion;
- searches performed, including meaningful negative results;
- citations or precise citation gaps;
- privacy or rights restrictions;
- the highest-value next actions.

For substantial deliverables, apply the quality gates before reporting completion. If a gate cannot pass, label the limitation and keep the conclusion provisional.
