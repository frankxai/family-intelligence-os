/** Draft validation only. This module never authorizes reads, acceptance, sharing or publication. */
export const nodeKinds = [
  "person",
  "artifact",
  "testimony",
  "claim",
  "principle",
  "lesson",
  "collection",
  "consent_reference",
] as const;
export type NodeKind = (typeof nodeKinds)[number];
export const graphScopes = [
  "private",
  "household",
  "family",
  "extended_family",
  "trusted_advisor",
  "public",
] as const;
export type GraphScope = (typeof graphScopes)[number];
export type KnowledgeNode = Readonly<{
  id: string;
  tenantId: string;
  kind: NodeKind;
  title: string;
  scope: GraphScope;
  sensitivity: "low" | "medium" | "high" | "critical";
  childRelated: boolean;
  state: "draft" | "review_required";
  sourceRefs: readonly string[];
}>;
export type KnowledgeEdge = Readonly<{
  id: string;
  tenantId: string;
  from: string;
  to: string;
  relation:
    | "supported_by"
    | "contradicted_by"
    | "derived_from"
    | "illustrates"
    | "teaches"
    | "part_of";
  scope: GraphScope;
  sourceRefs: readonly string[];
}>;
export type DraftGraph = Readonly<{
  schemaVersion: "1.0";
  tenantId: string;
  nodes: readonly KnowledgeNode[];
  edges: readonly KnowledgeEdge[];
}>;
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/;
const relations = new Set([
  "supported_by",
  "contradicted_by",
  "derived_from",
  "illustrates",
  "teaches",
  "part_of",
]);
const evidenceRelations = new Set([
  "supported_by",
  "contradicted_by",
  "derived_from",
]);
const validRefs = (refs: unknown): refs is string[] =>
  Array.isArray(refs) &&
  refs.length <= 100 &&
  refs.every((r) => typeof r === "string" && idPattern.test(r)) &&
  new Set(refs).size === refs.length;
/** Avoid widening in draft metadata. Authorized projection must separately check every endpoint and source. */
function compatibleScope(edge: GraphScope, node: GraphScope) {
  return edge === node || node === "public" || edge === "private";
}
export function validateDraftGraph(input: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { valid: false, errors: ["Graph must be an object"] };
  const g = input as Record<string, unknown>;
  if (
    g.schemaVersion !== "1.0" ||
    typeof g.tenantId !== "string" ||
    !idPattern.test(g.tenantId) ||
    !Array.isArray(g.nodes) ||
    !Array.isArray(g.edges)
  )
    return { valid: false, errors: ["Invalid graph envelope"] };
  if (g.nodes.length > 10000 || g.edges.length > 50000)
    return { valid: false, errors: ["Graph size exceeds draft limits"] };
  const nodes = new Map<string, KnowledgeNode>();
  const ids = new Set<string>();
  for (const raw of g.nodes) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push("Invalid node");
      continue;
    }
    const n = raw as KnowledgeNode;
    if (typeof n.id !== "string" || !idPattern.test(n.id) || ids.has(n.id))
      errors.push("Invalid or duplicate node ID");
    else ids.add(n.id);
    if (n.tenantId !== g.tenantId) errors.push("Cross-tenant node");
    if (
      !nodeKinds.includes(n.kind) ||
      !graphScopes.includes(n.scope) ||
      !["low", "medium", "high", "critical"].includes(n.sensitivity) ||
      typeof n.childRelated !== "boolean" ||
      !["draft", "review_required"].includes(n.state) ||
      typeof n.title !== "string" ||
      !n.title.trim() ||
      n.title.length > 500 ||
      !validRefs(n.sourceRefs)
    )
      errors.push("Invalid node fields");
    if (
      n.scope === "public" &&
      (n.childRelated ||
        n.sensitivity !== "low" ||
        n.kind === "person" ||
        n.kind === "consent_reference")
    )
      errors.push("Sensitive or personal nodes cannot be public drafts");
    if (
      n.kind === "claim" &&
      (!validRefs(n.sourceRefs) || n.sourceRefs.length === 0)
    )
      errors.push("Claim requires provenance");
    nodes.set(n.id, n);
  }
  const edgeIds = new Set<string>();
  for (const raw of g.edges) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push("Invalid edge");
      continue;
    }
    const e = raw as KnowledgeEdge;
    if (typeof e.id !== "string" || !idPattern.test(e.id) || edgeIds.has(e.id))
      errors.push("Invalid or duplicate edge ID");
    edgeIds.add(e.id);
    if (e.tenantId !== g.tenantId) errors.push("Cross-tenant edge");
    if (
      !relations.has(e.relation) ||
      !graphScopes.includes(e.scope) ||
      !validRefs(e.sourceRefs)
    )
      errors.push("Invalid edge fields");
    const from = nodes.get(e.from),
      to = nodes.get(e.to);
    if (!from || !to) {
      errors.push("Dangling edge");
      continue;
    }
    if (e.from === e.to)
      errors.push("Self-link requires a separate relation model");
    if (
      !compatibleScope(e.scope, from.scope) ||
      !compatibleScope(e.scope, to.scope)
    )
      errors.push("Edge widens endpoint scope");
    if (
      evidenceRelations.has(e.relation) &&
      (!validRefs(e.sourceRefs) || e.sourceRefs.length === 0)
    )
      errors.push("Factual relation requires provenance");
    if (e.scope === "public" && (from.childRelated || to.childRelated))
      errors.push("Child-related edge cannot be public");
  }
  for (const n of nodes.values())
    if (validRefs(n.sourceRefs))
      for (const ref of n.sourceRefs) {
        const source = nodes.get(ref);
        if (!source || !["artifact", "testimony"].includes(source.kind))
          errors.push("Node source must resolve to evidence in this graph");
        else if (!compatibleScope(n.scope, source.scope))
          errors.push("Node widens source scope");
      }
  for (const raw of g.edges) {
    const e = raw as KnowledgeEdge;
    if (e && validRefs(e.sourceRefs))
      for (const ref of e.sourceRefs) {
        const source = nodes.get(ref);
        if (!source || !["artifact", "testimony"].includes(source.kind))
          errors.push("Edge source must resolve to evidence in this graph");
        else if (!compatibleScope(e.scope, source.scope))
          errors.push("Edge widens source scope");
      }
  }
  return { valid: errors.length === 0, errors };
}
