# Research method

Use this reference for research plans, evidence correlation, identity resolution, conflict analysis, and proof writing.

## Proof standard

Use the five elements commonly summarized from the Genealogical Proof Standard:

1. Research broad enough to test the question against relevant evidence.
2. Complete, accurate citations for the sources used.
3. Analysis and correlation of the collected evidence.
4. Resolution of material conflicts, or an explicit explanation of why they remain unresolved.
5. A soundly reasoned written conclusion.

These elements work together. A document that directly states a parent is not automatically proof when the informant, identity, or conflicting evidence has not been examined.

## Atomic claims

Represent each assertion separately:

```yaml
claim_id: C-001
subject: person:P-017
predicate: parent
object: person:P-031
status: unresolved
evidence_refs: [E-003, E-008]
conflicts: [E-011]
reasoning: ""
next_test: ""
```

Do not combine birth date, birthplace, parents, and identity into one claim. A source can support one assertion while providing weak or secondary information for another.

## Evidence classification

Classify three different dimensions instead of collapsing them into “good” or “bad”:

- **Source:** original record, derivative copy/transcription/index, or authored synthesis.
- **Information:** primary, secondary, or undetermined for the specific assertion.
- **Evidence:** direct, indirect, or negative relative to the research question.

Assess the informant and creation context: who supplied the information, when, how close they were to the event, why the record was made, and which errors or incentives were possible.

## Source independence

Trace each item to its evidentiary origin. Treat these as one origin unless there is evidence otherwise:

- an index and the database search result that displays it;
- duplicate trees copied from the same unsourced tree;
- multiple transcriptions of the same register entry;
- a newspaper aggregation that republishes the same notice.

Independent corroboration comes from separately created records or observations. Document independence as `independent`, `shared_origin`, or `unknown`; do not assume it from different URLs.

## Research scope

Start with one question and build a source plan from locality, period, jurisdiction, religion/community, and record survival. Include:

- sources expected to answer the question directly;
- sources that establish identity across time;
- family, associates, and neighbors when direct-line evidence is insufficient;
- records from changing civil, church, colonial, or national jurisdictions;
- original or unindexed material behind derivative databases;
- known collection gaps and access constraints.

“Reasonably exhaustive” is proportional to the question. State which likely sources were unavailable or out of scope.

## Search log and negative evidence

Record the repository or database, collection coverage, exact query/variant, filters, date searched, result, and next implication. A failed query is not automatically negative evidence. Treat absence as evidence only when:

- the source should contain the event or person if the hypothesis is true;
- the relevant time, place, population, and record coverage are understood;
- spelling, indexing, image browsing, and jurisdictional alternatives were considered;
- record loss or noncompliance is accounted for.

## Conflict resolution

Build a comparison matrix. For every conflicting assertion, test:

- whether records refer to the same person;
- whether age, date, calendar, boundary, language, or transcription conventions explain the difference;
- which informant supplied each statement and their likely knowledge;
- whether one source derives from another;
- whether a hypothesis explains all evidence, not just favorable evidence;
- what new source could discriminate between competing explanations.

Do not resolve by majority vote. Explain why evidence is weighted differently.

## Conclusion statuses

- `lead`: untested pointer or user recollection.
- `supported`: credible evidence supports the claim, but significant testing remains.
- `strongly_supported`: research is broad, evidence correlates, and material conflicts are resolved.
- `contradicted`: stronger evidence rejects the claim.
- `unresolved`: evidence is insufficient or conflicts remain material.

Only describe a conclusion as meeting the GPS when all five elements are demonstrated in the work product. New evidence may still revise any historical conclusion.
