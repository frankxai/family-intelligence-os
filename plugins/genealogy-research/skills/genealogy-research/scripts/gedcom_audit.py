#!/usr/bin/env python3
"""Read-only GEDCOM structure, reference, and privacy audit.

This is a conservative preflight, not a complete FamilySearch GEDCOM
conformance validator. It never writes to the input file.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


LINE_PATTERN = re.compile(
    r"^(?P<level>0|[1-9][0-9]*) "
    r"(?:(?P<xref>@[^@\r\n]+@) )?"
    r"(?P<tag>[A-Za-z0-9_]+)"
    r"(?: (?P<value>.*))?$"
)
POINTER_PATTERN = re.compile(r"@[^@\r\n]+@")
YEAR_PATTERN = re.compile(r"(?<!\d)(?P<year>[12][0-9]{3})(?!\d)")
SENSITIVE_TAGS = {"SSN", "EMAIL", "PHON", "FAX", "ADDR"}
EXPECTED_REFERENCE_TYPES = {
    "FAMC": {"FAM"},
    "FAMS": {"FAM"},
    "HUSB": {"INDI"},
    "WIFE": {"INDI"},
    "CHIL": {"INDI"},
    "SOUR": {"SOUR"},
    "OBJE": {"OBJE"},
    "REPO": {"REPO"},
    "SUBM": {"SUBM"},
}


def _issue(
    issues: list[dict[str, Any]],
    severity: str,
    code: str,
    message: str,
    *,
    line: int | None = None,
    xref: str | None = None,
) -> None:
    item: dict[str, Any] = {
        "severity": severity,
        "code": code,
        "message": message,
    }
    if line is not None:
        item["line"] = line
    if xref is not None:
        item["xref"] = xref
    issues.append(item)


def _decode(raw: bytes) -> tuple[str, bool]:
    try:
        return raw.decode("utf-8-sig"), True
    except UnicodeDecodeError:
        return raw.decode("utf-8", errors="replace"), False


def _year(value: str) -> int | None:
    match = YEAR_PATTERN.search(value)
    return int(match.group("year")) if match else None


def audit_file(path: Path, *, living_years: int = 110) -> dict[str, Any]:
    """Audit one GEDCOM file and return a JSON-serializable report."""

    if living_years < 1:
        raise ValueError("living_years must be a positive integer")

    raw = path.read_bytes()
    text, utf8_valid = _decode(raw)
    issues: list[dict[str, Any]] = []
    declared_xrefs: dict[str, dict[str, Any]] = {}
    records: dict[str, dict[str, Any]] = {}
    references: list[dict[str, Any]] = []
    individuals: dict[str, dict[str, Any]] = {}
    families: dict[str, dict[str, Any]] = {}
    level_zero_structures: list[tuple[int, str]] = []
    tag_stack: list[str] = []
    current_record_xref: str | None = None
    current_record_type: str | None = None
    previous_level: int | None = None
    head_count = 0
    trailer_count = 0
    declared_version: str | None = None
    declared_charset: str | None = None

    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.rstrip("\r")
        if not line:
            _issue(
                issues,
                "warning",
                "blank_line",
                "Blank lines are not GEDCOM structures.",
                line=line_number,
            )
            continue

        match = LINE_PATTERN.fullmatch(line)
        if not match:
            _issue(
                issues,
                "error",
                "invalid_line",
                "Line does not match the GEDCOM level/xref/tag/value shape.",
                line=line_number,
            )
            continue

        level = int(match.group("level"))
        xref = match.group("xref")
        tag = match.group("tag").upper()
        value = match.group("value") or ""
        line_pointers = [
            pointer for pointer in POINTER_PATTERN.findall(value) if pointer != "@VOID@"
        ]

        if previous_level is not None and level > previous_level + 1:
            _issue(
                issues,
                "error",
                "level_jump",
                f"Structure level jumps from {previous_level} to {level}.",
                line=line_number,
            )
        previous_level = level

        if level > len(tag_stack):
            # Keep parsing after reporting the jump; pad only for safe indexing.
            tag_stack.extend([""] * (level - len(tag_stack)))
        else:
            tag_stack = tag_stack[:level]
        parent_tag = tag_stack[level - 1] if level > 0 and len(tag_stack) >= level else None
        tag_stack.append(tag)

        if xref:
            if xref in declared_xrefs:
                _issue(
                    issues,
                    "error",
                    "duplicate_xref",
                    "Cross-reference identifier is declared more than once.",
                    line=line_number,
                    xref=xref,
                )
            else:
                declared_xrefs[xref] = {"tag": tag, "line": line_number, "level": level}

        if level == 0:
            current_record_xref = xref
            current_record_type = tag
            level_zero_structures.append((line_number, tag))
            if tag == "HEAD":
                head_count += 1
            if tag == "TRLR":
                trailer_count += 1

            if xref:
                if xref not in records:
                    records[xref] = {"tag": tag, "line": line_number}
                if tag == "INDI":
                    individuals.setdefault(
                        xref,
                        {
                            "birth_year": None,
                            "death_year": None,
                            "deceased": False,
                            "sensitive_tags": set(),
                            "family_child_links": [],
                            "family_spouse_links": [],
                            "source_citations": 0,
                        },
                    )
                elif tag == "FAM":
                    families.setdefault(
                        xref,
                        {
                            "spouses": [],
                            "children": [],
                            "source_citations": 0,
                            "line": line_number,
                        },
                    )

        if current_record_type == "HEAD":
            if tag == "VERS" and parent_tag == "GEDC":
                declared_version = value.strip() or None
            elif level == 1 and tag == "CHAR":
                declared_charset = value.strip() or None

        if current_record_type == "INDI" and current_record_xref in individuals:
            person = individuals[current_record_xref]
            if level == 1 and tag in {"DEAT", "BURI"}:
                person["deceased"] = True
            elif tag == "DATE" and parent_tag == "BIRT" and person["birth_year"] is None:
                person["birth_year"] = _year(value)
            elif tag == "DATE" and parent_tag == "DEAT" and person["death_year"] is None:
                person["death_year"] = _year(value)
            elif tag == "FAMC":
                person["family_child_links"].extend(line_pointers)
            elif tag == "FAMS":
                person["family_spouse_links"].extend(line_pointers)
            if tag == "SOUR" and line_pointers:
                person["source_citations"] += 1
            if tag in SENSITIVE_TAGS:
                person["sensitive_tags"].add(tag)

        if current_record_type == "FAM" and current_record_xref in families:
            family = families[current_record_xref]
            if tag in {"HUSB", "WIFE"}:
                family["spouses"].extend(line_pointers)
            elif tag == "CHIL":
                family["children"].extend(line_pointers)
            if tag == "SOUR" and line_pointers:
                family["source_citations"] += 1

        for pointer in line_pointers:
            references.append(
                {
                    "from_xref": current_record_xref,
                    "tag": tag,
                    "target": pointer,
                    "line": line_number,
                }
            )

    if head_count != 1:
        _issue(
            issues,
            "error",
            "header_count",
            f"Expected exactly one HEAD record; found {head_count}.",
        )
    if trailer_count != 1:
        _issue(
            issues,
            "error",
            "trailer_count",
            f"Expected exactly one TRLR record; found {trailer_count}.",
        )
    if level_zero_structures:
        first_line, first_tag = level_zero_structures[0]
        last_line, last_tag = level_zero_structures[-1]
        if first_tag != "HEAD":
            _issue(
                issues,
                "error",
                "header_not_first",
                "HEAD must be the first level-0 structure.",
                line=first_line,
            )
        if last_tag != "TRLR":
            _issue(
                issues,
                "error",
                "trailer_not_last",
                "TRLR must be the final level-0 structure.",
                line=last_line,
            )
    if declared_version is None:
        _issue(
            issues,
            "warning",
            "missing_version",
            "Could not find HEAD.GEDC.VERS; interpretation is version-ambiguous.",
        )
    if not utf8_valid:
        severity = "error" if declared_version and declared_version.startswith("7") else "warning"
        _issue(
            issues,
            severity,
            "invalid_utf8",
            "Input is not valid UTF-8; a replacement-character view was audited.",
        )
    if declared_version and declared_version.startswith("7"):
        if declared_charset and declared_charset.upper() != "UTF-8":
            _issue(
                issues,
                "error",
                "gedcom7_charset",
                "GEDCOM 7 data must use UTF-8, but HEAD.CHAR declares another encoding.",
            )

    for reference in references:
        target = reference["target"]
        target_record = declared_xrefs.get(target)
        if target_record is None:
            _issue(
                issues,
                "error",
                "dangling_reference",
                f"{reference['tag']} points to an undeclared cross-reference.",
                line=reference["line"],
                xref=target,
            )
            continue
        expected = EXPECTED_REFERENCE_TYPES.get(reference["tag"])
        if expected and target_record["tag"] not in expected:
            _issue(
                issues,
                "error",
                "reference_type",
                f"{reference['tag']} points to {target_record['tag']}; expected {', '.join(sorted(expected))}.",
                line=reference["line"],
                xref=target,
            )

    current_year = datetime.now(timezone.utc).year
    for xref, person in individuals.items():
        birth_year = person["birth_year"]
        death_year = person["death_year"]
        if birth_year and death_year and birth_year > death_year:
            _issue(
                issues,
                "warning",
                "chronology_birth_after_death",
                "Parsed birth year is later than parsed death year; inspect date phrases and source data.",
                xref=xref,
            )
        if birth_year and birth_year > current_year:
            _issue(
                issues,
                "warning",
                "chronology_future_birth",
                "Parsed birth year is in the future; inspect date parsing and source data.",
                xref=xref,
            )
        if death_year and death_year > current_year:
            _issue(
                issues,
                "warning",
                "chronology_future_death",
                "Parsed death year is in the future; inspect date parsing and source data.",
                xref=xref,
            )

    for family_xref, family in families.items():
        spouses = family["spouses"]
        children = family["children"]
        if len(spouses) != len(set(spouses)) or len(children) != len(set(children)):
            _issue(
                issues,
                "warning",
                "duplicate_family_link",
                "Family record repeats a spouse or child reference.",
                line=family["line"],
                xref=family_xref,
            )
        for member_xref in sorted(set(spouses) & set(children)):
            _issue(
                issues,
                "warning",
                "family_role_collision",
                "The same individual is linked as both spouse and child in one family.",
                line=family["line"],
                xref=member_xref,
            )
        for spouse_xref in set(spouses):
            person = individuals.get(spouse_xref)
            if person is not None and family_xref not in person["family_spouse_links"]:
                _issue(
                    issues,
                    "warning",
                    "missing_individual_spouse_backlink",
                    "Family spouse link has no matching FAMS link on the individual.",
                    line=family["line"],
                    xref=spouse_xref,
                )
        for child_xref in set(children):
            person = individuals.get(child_xref)
            if person is not None and family_xref not in person["family_child_links"]:
                _issue(
                    issues,
                    "warning",
                    "missing_individual_child_backlink",
                    "Family child link has no matching FAMC link on the individual.",
                    line=family["line"],
                    xref=child_xref,
                )

    for person_xref, person in individuals.items():
        for family_xref in set(person["family_spouse_links"]):
            family = families.get(family_xref)
            if family is not None and person_xref not in family["spouses"]:
                _issue(
                    issues,
                    "warning",
                    "missing_family_spouse_link",
                    "Individual FAMS link has no matching spouse link on the family.",
                    xref=person_xref,
                )
        for family_xref in set(person["family_child_links"]):
            family = families.get(family_xref)
            if family is not None and person_xref not in family["children"]:
                _issue(
                    issues,
                    "warning",
                    "missing_family_child_link",
                    "Individual FAMC link has no matching CHIL link on the family.",
                    xref=person_xref,
                )

    cutoff_year = current_year - living_years
    possible_living_count = 0
    sensitive_possible_living_count = 0
    for xref, person in individuals.items():
        birth_year = person["birth_year"]
        possibly_living = not person["deceased"] and (
            birth_year is None or birth_year >= cutoff_year
        )
        if not possibly_living:
            continue
        possible_living_count += 1
        sensitive_tags = sorted(person["sensitive_tags"])
        if sensitive_tags:
            sensitive_possible_living_count += 1
            _issue(
                issues,
                "warning",
                "possible_living_sensitive_data",
                "Possibly living individual contains sensitive tags: " + ", ".join(sensitive_tags) + ".",
                xref=xref,
            )

    severity_counts = {
        severity: sum(1 for item in issues if item["severity"] == severity)
        for severity in ("error", "warning", "info")
    }
    record_counts: dict[str, int] = {}
    for record in records.values():
        record_counts[record["tag"]] = record_counts.get(record["tag"], 0) + 1

    issues.sort(
        key=lambda item: (
            {"error": 0, "warning": 1, "info": 2}[item["severity"]],
            item.get("line", 0),
            item["code"],
        )
    )
    return {
        "schema_version": "1.0",
        "file": str(path.resolve()),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "declared_gedcom_version": declared_version,
        "declared_charset": declared_charset,
        "utf8_valid": utf8_valid,
        "summary": {
            "lines": len(text.splitlines()),
            "records": len(records),
            "declared_xrefs": len(declared_xrefs),
            "record_counts": dict(sorted(record_counts.items())),
            "references": len(references),
            "individuals_without_source_citations": sum(
                1 for person in individuals.values() if person["source_citations"] == 0
            ),
            "families_without_source_citations": sum(
                1 for family in families.values() if family["source_citations"] == 0
            ),
            "possible_living_individuals": possible_living_count,
            "possible_living_with_sensitive_tags": sensitive_possible_living_count,
            "issues": severity_counts,
        },
        "issues": issues,
        "limitations": [
            "Read-only conservative preflight; not a complete GEDCOM conformance validator.",
            "Living-person detection is heuristic and does not establish life status.",
            "The report omits personal names and record values but includes cross-reference identifiers.",
        ],
    }


def _print_human(report: dict[str, Any]) -> None:
    summary = report["summary"]
    counts = summary["issues"]
    print(f"GEDCOM audit: {report['file']}")
    print(f"SHA-256: {report['sha256']}")
    print(f"Declared version: {report['declared_gedcom_version'] or 'unknown'}")
    print(f"Records: {summary['records']} | References: {summary['references']}")
    print(
        "Issues: "
        f"{counts['error']} error(s), {counts['warning']} warning(s), {counts['info']} info"
    )
    print(
        "Privacy heuristic: "
        f"{summary['possible_living_individuals']} possibly living; "
        f"{summary['possible_living_with_sensitive_tags']} with sensitive tags"
    )
    print(
        "Citation coverage: "
        f"{summary['individuals_without_source_citations']} individual(s) and "
        f"{summary['families_without_source_citations']} family record(s) without SOUR structures"
    )
    for item in report["issues"]:
        location = f" line {item['line']}" if "line" in item else ""
        xref = f" {item['xref']}" if "xref" in item else ""
        print(f"[{item['severity'].upper()}] {item['code']}{location}{xref}: {item['message']}")


def _should_fail(report: dict[str, Any], threshold: str) -> bool:
    counts = report["summary"]["issues"]
    if threshold == "never":
        return False
    if threshold == "warning":
        return counts["error"] > 0 or counts["warning"] > 0
    return counts["error"] > 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("gedcom", type=Path, help="Path to a .ged file")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of a human summary")
    parser.add_argument(
        "--living-years",
        type=int,
        default=110,
        help="Treat an individual without death evidence as possibly living when born within this many years (default: 110)",
    )
    parser.add_argument(
        "--fail-on",
        choices=("error", "warning", "never"),
        default="error",
        help="Exit non-zero at this issue severity (default: error)",
    )
    args = parser.parse_args(argv)

    try:
        report = audit_file(args.gedcom, living_years=args.living_years)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_human(report)
    return 1 if _should_fail(report, args.fail_on) else 0


if __name__ == "__main__":
    sys.exit(main())
