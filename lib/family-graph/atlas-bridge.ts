/**
 * The versioned interface between this OS and `frankxai/family-history-atlas`.
 *
 * The Atlas owns compilation, layout, and rendering. It accepts exactly one input shape,
 * `AtlasSource` schemaVersion "1" (see `src/atlas/schema.ts` in that repo). This file restates
 * that shape as a structural contract so the OS can target it without a cross-repo dependency
 * and without copying the compiler.
 *
 * The Atlas compiler filters `lifeStatus !== "deceased"` at compile time, but its free-text
 * fields (`summary`, event `title` and `description`) survive that filter. A living relative
 * named inside a deceased person's summary therefore reaches a public page even though the
 * living person's node was dropped. That is why the exclusion decision belongs HERE, upstream:
 * the OS must never hand the Atlas a source that contains living-person data at all.
 */

export const ATLAS_SOURCE_INTERFACE_VERSION = "AtlasSource@1" as const;

export type AtlasEvidenceConclusion =
  | "lead"
  | "supported"
  | "strongly_supported"
  | "contradicted"
  | "unresolved";

export type AtlasSourceV1 = Readonly<{
  schemaVersion: "1";
  assurance: "synthetic" | "sanitized";
  title: string;
  subtitle: string;
  provenanceNote: string;
  people: readonly Readonly<{
    id: string;
    displayName: string;
    years: string;
    lifeStatus: "deceased" | "living" | "uncertain";
    role: string;
    summary: string;
    place?: string;
    evidence: AtlasEvidenceConclusion;
    sourceCount: number;
  }>[];
  relationships: readonly Readonly<{
    id: string;
    from: string;
    to: string;
    kind: "parent" | "adoptive_parent" | "guardian" | "partner" | "chosen_family";
    evidence: AtlasEvidenceConclusion;
    label?: string;
  }>[];
  events: readonly Readonly<{
    id: string;
    year: string;
    title: string;
    description: string;
    personIds: readonly string[];
    place?: string;
    evidence: AtlasEvidenceConclusion;
  }>[];
  researchQuestions: readonly Readonly<{
    id: string;
    question: string;
    status: "open" | "conflicted" | "next_search";
    nextAction: string;
  }>[];
}>;

/** Source grade A–D maps onto the Atlas conclusion vocabulary; `unknown` stays a lead. */
export function gradeToConclusion(grade: "A" | "B" | "C" | "D" | "unknown"): AtlasEvidenceConclusion {
  switch (grade) {
    case "A":
      return "strongly_supported";
    case "B":
      return "supported";
    case "C":
      return "lead";
    case "D":
      return "unresolved";
    default:
      return "lead";
  }
}
