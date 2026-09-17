# GEDCOM handling

Use for GEDCOM inspection, interoperability, conversion, merge planning, validation, or export review.

## Version awareness

Identify the declared version before interpreting a file. GEDCOM 5.5.1 remains common, while FamilySearch GEDCOM 7 is the current major specification family. The latest published patch may change, so consult https://gedcom.io/specs/ when exact conformance matters. Do not assume a 5.5.1 file is valid 7.x or vice versa.

## Safe workflow

1. Preserve the original file and compute a hash when provenance matters.
2. Detect encoding and declared version. GEDCOM 7 data streams use UTF-8; legacy files may use encodings that require a compatible parser.
3. Run the read-only audit:

   ```bash
   python scripts/gedcom_audit.py path/to/tree.ged --json
   ```

4. Review structural errors, duplicate or dangling cross-references, relationship target types, asymmetric family links, parsed chronology anomalies, source-citation coverage, and possible living-person exposure.
5. Correlate imported claims with source records. An import does not make a claim accepted or verified.
6. If transformation is requested, write a new output file, retain unsupported tags and notes where possible, produce a diff/audit summary, and give rollback instructions. Never overwrite the only copy.

The bundled auditor is intentionally conservative and is not a complete conformance validator. Use the official specification and official test resources for format certification.

## Mapping rules

- Preserve stable cross-reference identifiers when the represented entity has not changed.
- Keep recorded names, normalized names, aliases, and name parts distinct.
- Do not infer biological parentage from a family link without examining relationship qualifiers and sources.
- Preserve adoption, guardianship, foster, step, and other relationship context.
- Retain source records and citation locators; do not collapse all citations into free-text notes.
- Preserve date phrases, ranges, approximations, calendars, and original place text alongside normalization.
- Record extension tags and unsupported structures instead of silently dropping them.
- Treat media paths, private notes, addresses, contact fields, DNA extensions, and living-person records as export-sensitive.

## Merge policy

Never merge people by name and date similarity alone. Produce candidate matches with supporting and conflicting attributes. A human steward must approve identity merges and authoritative family-tree changes. Before an approved merge, show surviving identifiers, field-level choices, citations retained, relationships affected, and the rollback artifact.

## Export review

Before sharing a GEDCOM or GedZip, review:

- living people and minors;
- private notes, submitter data, addresses, email, phone, identifiers, and media;
- DNA or sensitive relationship information;
- source/media rights and distribution permissions;
- broken local media paths and unsupported extensions;
- whether the recipient needs 5.5.1, 7.x, or another interchange format.
