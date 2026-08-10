export type GedcomEvent = {
  tag: "BIRT" | "DEAT" | "BURI" | "CHR" | "RESI";
  date?: string;
  place?: string;
  sourceXrefs?: string[];
};

export type GedcomIndividual = {
  xref: string;
  givenNames?: string;
  surname?: string;
  suffix?: string;
  sex?: "M" | "F" | "X" | "U";
  events?: GedcomEvent[];
  sourceXrefs?: string[];
};

export type GedcomFamily = {
  xref: string;
  husbandXref?: string;
  wifeXref?: string;
  childXrefs?: string[];
  sourceXrefs?: string[];
};

export type GedcomSource = {
  xref: string;
  title: string;
  author?: string;
  publication?: string;
  note?: string;
};

export type GedcomExportInput = {
  sourceName: string;
  sourceVersion: string;
  language?: string;
  individuals: GedcomIndividual[];
  families?: GedcomFamily[];
  sources?: GedcomSource[];
};

export function serializeGedcom7(input: GedcomExportInput): string {
  const lines = [
    "0 HEAD",
    "1 GEDC",
    "2 VERS 7.0",
    `1 SOUR ${value(input.sourceName)}`,
    `2 VERS ${value(input.sourceVersion)}`,
    "1 CHAR UTF-8",
    `1 LANG ${value(input.language ?? "English")}`
  ];

  for (const individual of sortByXref(input.individuals)) {
    lines.push(`0 ${xref(individual.xref)} INDI`);
    const displayName = `${namePart(individual.givenNames)} /${namePart(individual.surname)}/${individual.suffix ? ` ${namePart(individual.suffix)}` : ""}`.trim();
    if (displayName !== "//") lines.push(`1 NAME ${displayName}`);
    if (individual.sex) lines.push(`1 SEX ${individual.sex}`);
    for (const event of individual.events ?? []) {
      lines.push(`1 ${event.tag}`);
      if (event.date) lines.push(`2 DATE ${value(event.date)}`);
      if (event.place) lines.push(`2 PLAC ${value(event.place)}`);
      for (const sourceRef of unique(individualSourceRefs(event.sourceXrefs))) {
        lines.push(`2 SOUR ${xref(sourceRef)}`);
      }
    }
    for (const sourceRef of unique(individual.sourceXrefs ?? [])) {
      lines.push(`1 SOUR ${xref(sourceRef)}`);
    }
  }

  for (const family of sortByXref(input.families ?? [])) {
    lines.push(`0 ${xref(family.xref)} FAM`);
    if (family.husbandXref) lines.push(`1 HUSB ${xref(family.husbandXref)}`);
    if (family.wifeXref) lines.push(`1 WIFE ${xref(family.wifeXref)}`);
    for (const childRef of unique(family.childXrefs ?? [])) lines.push(`1 CHIL ${xref(childRef)}`);
    for (const sourceRef of unique(family.sourceXrefs ?? [])) lines.push(`1 SOUR ${xref(sourceRef)}`);
  }

  for (const source of sortByXref(input.sources ?? [])) {
    lines.push(`0 ${xref(source.xref)} SOUR`);
    lines.push(`1 TITL ${value(source.title)}`);
    if (source.author) lines.push(`1 AUTH ${value(source.author)}`);
    if (source.publication) lines.push(`1 PUBL ${value(source.publication)}`);
    if (source.note) addMultiline(lines, 1, "NOTE", source.note);
  }

  lines.push("0 TRLR");
  return `${lines.join("\n")}\n`;
}

function xref(raw: string): string {
  const cleaned = raw.replaceAll("@", "").replace(/[^A-Za-z0-9_.:-]/g, "_");
  if (!cleaned) throw new Error("GEDCOM xref cannot be empty.");
  return `@${cleaned}@`;
}

function value(raw: string): string {
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r?\n/g, " ").trim();
}

function namePart(raw = ""): string {
  return value(raw).replaceAll("/", "");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function sortByXref<T extends { xref: string }>(values: T[]): T[] {
  return [...values].sort((left, right) => left.xref.localeCompare(right.xref));
}

function individualSourceRefs(sourceXrefs: string[] | undefined): string[] {
  return sourceXrefs ?? [];
}

function addMultiline(lines: string[], level: number, tag: string, raw: string): void {
  const [first = "", ...rest] = raw.split(/\r?\n/);
  lines.push(`${level} ${tag} ${value(first)}`.trimEnd());
  for (const continuation of rest) lines.push(`${level + 1} CONT ${value(continuation)}`.trimEnd());
}
