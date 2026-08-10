# v0 build prompt — German Family Intelligence Portal

Build a production-quality Next.js App Router interface for a private German family portal called **Familienportal**.

## Product outcome

Help a family preserve knowledge, organize relationships, review lineage claims, record consent, and prepare emergency or succession plans. The experience should feel calm, legible, warm, and institutional — a trusted archive, not a social feed.

## Required route

Create `/de/portal` with two states:

1. **Locked:** the default in production. Explain in German that no family data is loaded until per-person authentication and family-scoped authorization exist.
2. **Synthetic preview:** development-only. It must use generic labels and zero records; never invent relatives, dates, documents, or family history.

## Required modules

- A privacy seal that clearly identifies preview or authenticated state.
- Six access circles: Ich, Haushalt, Engster Kreis, Erweiterte Familie, Nachkommen & Patenschaften, Öffentliches Archiv.
- A steward review queue for claims, evidence, consent, publication, disputes, and continuity.
- A compact provenance pattern that distinguishes Behauptung, Quelle, Prüfung, and Entscheidung.
- A continuity panel that keeps Notfall, Handlungsunfähigkeit, and Tod as separate protocols.
- A secure contribution empty state that explains one-time links, quarantine, malware scanning, and steward review without pretending uploads are active.
- Separate navigation for Nachkommen & Patenschaften with guardian-managed, age-transition language and no child profiles.

## Non-negotiable safety rules

- No living person is public by default.
- No child data can enter the public archive.
- AI may extract and compare claims but cannot accept, reject, publish, contact, verify death, or release access.
- Publication requires purpose-specific active consent for every affected living adult plus a human redaction review.
- Inactivity is never a succession trigger.
- Every control must expose its scope and audit consequence.
- The caller can never choose its own family ID, actor ID, or role.

## Visual direction

Use a near-black graphite foundation, warm ivory type, muted sage for trusted states, amber for pending review, and restrained red for blocked states. Prefer one strong editorial hierarchy, exact borders, generous spacing, and a compact system diagram made from real UI elements. Avoid neon gradients, glass-card grids, floating orbs, generic family-tree illustrations, fake analytics, and decorative 3D.

Use semantic HTML, visible focus states, WCAG AA contrast, 44px touch targets, reduced-motion support, and responsive layouts from 360px upward. Motion may clarify state changes only; the static composition must remain complete.

## Engineering constraints

- TypeScript and server components by default.
- No external data calls in the prototype.
- No secrets or PII in source, logs, metadata, or fixtures.
- Export small reusable components, but keep the route understandable without a design-system dependency.
- Return the route, component files, styles, and a short verification checklist.
