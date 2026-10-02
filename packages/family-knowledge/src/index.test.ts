import { describe, it, expect } from "vitest";
import { validateDraftGraph, type DraftGraph } from "./index";
const graph = (): DraftGraph => ({
  schemaVersion: "1.0",
  tenantId: "tenant_example",
  nodes: [
    {
      id: "source_original",
      tenantId: "tenant_example",
      kind: "artifact",
      title: "Synthetic recording",
      scope: "private",
      sensitivity: "high",
      childRelated: false,
      state: "draft",
      sourceRefs: [],
    },
    {
      id: "claim_candidate",
      tenantId: "tenant_example",
      kind: "claim",
      title: "Synthetic claim",
      scope: "private",
      sensitivity: "high",
      childRelated: false,
      state: "review_required",
      sourceRefs: ["source_original"],
    },
  ],
  edges: [
    {
      id: "edge_example",
      tenantId: "tenant_example",
      from: "claim_candidate",
      to: "source_original",
      relation: "supported_by",
      scope: "private",
      sourceRefs: ["source_original"],
    },
  ],
});
describe("draft graph boundary", () => {
  it("validates a sourced private candidate without granting acceptance", () =>
    expect(validateDraftGraph(graph()).valid).toBe(true));
  it("rejects tenant mixing", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        nodes: g.nodes.map((n) => ({ ...n, tenantId: "tenant_other" })),
      }).valid,
    ).toBe(false);
  });
  it("rejects child-related public nodes", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        nodes: g.nodes.map((n) => ({
          ...n,
          scope: "public",
          sensitivity: "low",
          childRelated: true,
        })),
      }).valid,
    ).toBe(false);
  });
  it("rejects widening a private endpoint", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        edges: g.edges.map((e) => ({ ...e, scope: "family" })),
      }).valid,
    ).toBe(false);
  });
  it("rejects dangling and forged source references", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        edges: g.edges.map((e) => ({
          ...e,
          to: "missing_node",
          sourceRefs: ["made_up_source"],
        })),
      }).valid,
    ).toBe(false);
  });
  it("rejects accepted claims in the draft API", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        nodes: g.nodes.map((n) => ({ ...n, state: "accepted" })),
      }).valid,
    ).toBe(false);
  });
  it("rejects invalid enums, missing provenance and duplicate IDs", () => {
    const g = graph();
    for (const fields of [
      { kind: "secret" },
      { scope: "everyone" },
      { sourceRefs: [] },
      { id: "source_original" },
    ])
      expect(
        validateDraftGraph({
          ...g,
          nodes: [g.nodes[0], { ...g.nodes[1], ...fields }],
        }).valid,
      ).toBe(false);
  });
  it("rejects leaked private source metadata even when endpoints are public", () => {
    const g = graph();
    expect(
      validateDraftGraph({
        ...g,
        nodes: [
          g.nodes[0],
          { ...g.nodes[1], scope: "public", sensitivity: "low" },
        ],
      }).valid,
    ).toBe(false);
  });
  it("does not throw on malformed graph input", () => {
    for (const input of [
      null,
      {},
      [],
      { ...graph(), nodes: [null], edges: [null] },
      { ...graph(), edges: [{ sourceRefs: null }] },
    ])
      expect(() => validateDraftGraph(input)).not.toThrow();
  });
});
