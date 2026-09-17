from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "gedcom_audit.py"
SPEC = importlib.util.spec_from_file_location("gedcom_audit", SCRIPT_PATH)
assert SPEC and SPEC.loader
GEDCOM_AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GEDCOM_AUDIT)


class GedcomAuditTests(unittest.TestCase):
    def audit(self, content: str):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "tree.ged"
            path.write_text(content, encoding="utf-8")
            return GEDCOM_AUDIT.audit_file(path)

    def test_valid_linked_file_has_no_errors(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "1 CHAR UTF-8",
                    "0 @I1@ INDI",
                    "1 NAME Ada /Example/",
                    "1 BIRT",
                    "2 DATE 1 JAN 1880",
                    "1 DEAT",
                    "2 DATE 2 FEB 1950",
                    "1 FAMS @F1@",
                    "1 SOUR @S1@",
                    "0 @I2@ INDI",
                    "1 NAME Ben /Example/",
                    "1 DEAT",
                    "1 FAMC @F1@",
                    "1 SOUR @S1@",
                    "0 @F1@ FAM",
                    "1 HUSB @I1@",
                    "1 CHIL @I2@",
                    "1 SOUR @S1@",
                    "0 @S1@ SOUR",
                    "1 TITL Synthetic test source",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertEqual(report["summary"]["issues"]["error"], 0)
        self.assertEqual(
            report["summary"]["record_counts"],
            {"FAM": 1, "INDI": 2, "SOUR": 1},
        )
        self.assertEqual(report["summary"]["references"], 7)
        self.assertEqual(report["summary"]["individuals_without_source_citations"], 0)
        self.assertEqual(report["summary"]["families_without_source_citations"], 0)

    def test_duplicate_and_dangling_references_are_errors(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "0 @I1@ INDI",
                    "0 @F1@ FAM",
                    "1 CHIL @I404@",
                    "0 TRLR",
                    "",
                ]
            )
        )
        codes = {issue["code"] for issue in report["issues"]}
        self.assertIn("duplicate_xref", codes)
        self.assertIn("dangling_reference", codes)

    def test_reference_type_is_checked(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 FAMC @I2@",
                    "0 @I2@ INDI",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertIn("reference_type", {issue["code"] for issue in report["issues"]})

    def test_level_jump_is_reported(self):
        report = self.audit("0 HEAD\n2 VERS 7.0\n0 TRLR\n")
        self.assertIn("level_jump", {issue["code"] for issue in report["issues"]})

    def test_possible_living_sensitive_data_is_private_warning(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 BIRT",
                    "2 DATE 1 JAN 2000",
                    "1 EMAIL private@example.invalid",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertEqual(report["summary"]["possible_living_with_sensitive_tags"], 1)
        self.assertIn(
            "possible_living_sensitive_data",
            {issue["code"] for issue in report["issues"]},
        )
        serialized = str(report)
        self.assertNotIn("private@example.invalid", serialized)

    def test_subordinate_xref_can_resolve_a_pointer(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 NOTE @N1@",
                    "1 @N1@ NOTE Shared note",
                    "1 DEAT",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertNotIn("dangling_reference", {issue["code"] for issue in report["issues"]})
        self.assertEqual(report["summary"]["declared_xrefs"], 2)

    def test_header_and_trailer_order_are_checked(self):
        report = self.audit(
            "\n".join(
                [
                    "0 @I1@ INDI",
                    "1 DEAT",
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 TRLR",
                    "0 @N1@ NOTE After trailer",
                    "",
                ]
            )
        )
        codes = {issue["code"] for issue in report["issues"]}
        self.assertIn("header_not_first", codes)
        self.assertIn("trailer_not_last", codes)

    def test_asymmetric_family_links_are_reported(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 FAMS @F1@",
                    "1 DEAT",
                    "0 @I2@ INDI",
                    "1 DEAT",
                    "0 @F1@ FAM",
                    "1 CHIL @I2@",
                    "0 TRLR",
                    "",
                ]
            )
        )
        codes = {issue["code"] for issue in report["issues"]}
        self.assertIn("missing_family_spouse_link", codes)
        self.assertIn("missing_individual_child_backlink", codes)

    def test_impossible_chronology_is_reported(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 BIRT",
                    "2 DATE 1 JAN 2000",
                    "1 DEAT",
                    "2 DATE 1 JAN 1900",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertIn(
            "chronology_birth_after_death",
            {issue["code"] for issue in report["issues"]},
        )

    def test_void_source_assertion_does_not_count_as_citation(self):
        report = self.audit(
            "\n".join(
                [
                    "0 HEAD",
                    "1 GEDC",
                    "2 VERS 7.0",
                    "0 @I1@ INDI",
                    "1 DEAT",
                    "1 SOUR @VOID@",
                    "0 TRLR",
                    "",
                ]
            )
        )
        self.assertEqual(report["summary"]["individuals_without_source_citations"], 1)
        self.assertNotIn("dangling_reference", {issue["code"] for issue in report["issues"]})


if __name__ == "__main__":
    unittest.main()
