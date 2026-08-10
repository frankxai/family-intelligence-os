import { describe, expect, it } from "vitest";
import { serializeGedcom7 } from "./index";

describe("GEDCOM 7 projection", () => {
  it("serializes deterministic individuals, family links, sources, and trailer", () => {
    const output = serializeGedcom7({
      sourceName: "FAMILY_INTELLIGENCE_OS",
      sourceVersion: "0.1.0",
      language: "German",
      individuals: [
        { xref: "I2", givenNames: "Example Child", surname: "Sample", sourceXrefs: ["S1"] },
        { xref: "I1", givenNames: "Example", surname: "Sample", sex: "U", events: [{ tag: "BIRT", date: "1 JAN 1900", place: "Example Place", sourceXrefs: ["S1"] }] }
      ],
      families: [{ xref: "F1", childXrefs: ["I2"], sourceXrefs: ["S1"] }],
      sources: [{ xref: "S1", title: "Synthetic test source", note: "Line one\nLine two" }]
    });

    expect(output).toContain("2 VERS 7.0");
    expect(output.indexOf("0 @I1@ INDI")).toBeLessThan(output.indexOf("0 @I2@ INDI"));
    expect(output).toContain("1 CHIL @I2@");
    expect(output).toContain("2 CONT Line two");
    expect(output.endsWith("0 TRLR\n")).toBe(true);
  });

  it("removes GEDCOM delimiters from name parts", () => {
    const output = serializeGedcom7({
      sourceName: "TEST",
      sourceVersion: "1",
      individuals: [{ xref: "I1", givenNames: "A/B", surname: "C/D" }]
    });
    expect(output).toContain("1 NAME AB /CD/");
  });
});
