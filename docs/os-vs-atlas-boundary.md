# OS vs Atlas — where the boundary runs

Two repositories, one direction of travel. Nothing crosses back.

| | `family-intelligence-os` (this repo) | `family-history-atlas` |
| --- | --- | --- |
| Holds | the family's private packet, consent receipts, evidence, claims, succession policy | nothing private, ever |
| Decides | who may be published, which claim is accepted, which evidence has rights | how a public-safe document is laid out and animated |
| Deploys to | a self-hosted, family-owned runtime | a public URL |
| Contract | emits `AtlasSource@1` | consumes `AtlasSource@1` |
| Assurance | may hold real records | `assurance: "synthetic"` until a reviewed sanitized source exists |

## The interface

`lib/family-graph/atlas-bridge.ts` restates the Atlas's `AtlasSource` schemaVersion `"1"` as a
structural type. The OS targets it; it does not import the Atlas, and the Atlas does not import
the OS. When the Atlas bumps its schema version, this file gains a second exported type and
`projectPublicSafe` gains a second emitter. Neither repo forks the other's concepts.

`projectPublicSafe` in `lib/family-graph/pipeline.ts` is the only function permitted to produce
an `AtlasSource`. It returns the source together with a `PublicProjection` node whose
`exclusions` array names every record that was withheld and why.

## Why exclusion is decided here, not there

The Atlas compiler filters `lifeStatus !== "deceased"` before layout, which correctly stops a
living person becoming a node. It does not scrub free text. A deceased person's `summary`, and an
event's `title` and `description`, pass through the filter unchanged — so a living relative named
inside a deceased person's biography still reaches a public page.

That is not a bug the Atlas can fix alone: it has no consent receipts and no way to know which
names are living. The OS has both. So the rule is upstream and absolute:

> The OS never hands the Atlas a source that contains living-person data at all.

`projectPublicSafe` enforces it three ways, and `lib/family-graph/projection.test.ts` asserts each:

1. **Node absence, not redaction.** A living person without an active, self-authorised,
   `public_archive`-scoped publish receipt produces no node.
2. **Name absence.** Any person summary, story title, or story body that mentions an excluded
   person's display name is withheld, and the carrying node is withheld with it.
3. **Serialized proof.** For every person in the fixture, the test makes that person living and
   unconsented, compiles, and asserts their display name appears nowhere in
   `JSON.stringify(atlasSource)`.

Jurisdiction sits above all three: `livingPersonRule: "never_publish"` removes every living
person regardless of consent, and `recordEmbargoYears` withholds a deceased record whose embargo
has not expired.

## Deletion

`deletePerson` removes the person, their relationships, and any story about them, and returns a
tombstone. The tombstone carries no content — only the subject reference, the deleting steward,
the removed field *names*, the retention basis, and the revision before deletion. A later
projection emits a `deleted` exclusion for that reference, so an absence is provably deliberate
rather than a compilation failure.

## Productization

Self-hosted family kit or a bounded installation only, and only after a threat model. No
centralized family-data SaaS — a multi-tenant store of living people's records is the one product
shape this architecture exists to refuse.
