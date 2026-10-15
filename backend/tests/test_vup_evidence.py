import json
import unittest
from pathlib import Path

from backend.app.schemas.vup_evidence import VUPEvidenceResponse
from backend.app.services.vup_evidence_service import (
    VUPEvidenceService,
)


ROOT = Path(__file__).resolve().parents[2]
AGGREGATE_PATH = ROOT / "data" / "processed" / "vup_evidence_summary.json"


class TestVUPEvidence(unittest.TestCase):
    def test_aggregate_payload_matches_response_schema(self):
        payload = VUPEvidenceService(AGGREGATE_PATH).get_evidence()
        self.assertEqual(
            payload['metadata']['master_households'],
            3771,
        )
        self.assertEqual(
            payload['overlap']['households_in_any_component'],
            3709,
        )

    def test_malformed_json_fails_closed(self):
        from backend.app.services.vup_evidence_service import (
            VUPEvidenceUnavailableError,
        )

        malformed_path = (
            ROOT / "data" / "processed" / "__malformed_vup_test__.json"
        )

        try:
            malformed_path.write_text("{invalid json", encoding="utf-8")

            with self.assertRaises(VUPEvidenceUnavailableError):
                VUPEvidenceService(malformed_path).get_evidence()
        finally:
            malformed_path.unlink(missing_ok=True)

    def test_invalid_schema_fails_closed(self):
        from backend.app.services.vup_evidence_service import (
            VUPEvidenceUnavailableError,
        )

        invalid_path = (
            ROOT / "data" / "processed" / "__invalid_vup_test__.json"
        )

        try:
            invalid_path.write_text(
                '{"unexpected_field": true}',
                encoding="utf-8",
            )

            with self.assertRaises(VUPEvidenceUnavailableError):
                VUPEvidenceService(invalid_path).get_evidence()
        finally:
            invalid_path.unlink(missing_ok=True)


    def test_overlap_distribution_reconciles_to_master(self):
        payload = VUPEvidenceService(AGGREGATE_PATH).get_evidence()
        bands = payload["overlap"]["distribution_by_component_count"]

        self.assertEqual(
            sum(item["households"] for item in bands),
            payload["metadata"]["master_households"],
        )
        self.assertEqual(
            next(
                item["households"]
                for item in bands
                if item["components_per_household"] == 0
            ),
            62,
        )

    def test_response_contains_no_household_level_fields(self):
        payload = VUPEvidenceService(AGGREGATE_PATH).get_evidence()

        forbidden_keys = {
            "hhid", "household_id", "pid", "person_id",
            "individual_amount", "household_record",
        }

        def inspect(value):
            if isinstance(value, dict):
                for key, child in value.items():
                    self.assertNotIn(key.lower(), forbidden_keys)
                    inspect(child)
            elif isinstance(value, list):
                for child in value:
                    inspect(child)

        inspect(payload)

    def test_missing_aggregate_file_fails_closed(self):
        from backend.app.services.vup_evidence_service import (
            VUPEvidenceUnavailableError,
        )

        missing_path = (
            ROOT / "data" / "processed" / "__missing_vup_test__.json"
        )

        with self.assertRaises(VUPEvidenceUnavailableError):
            VUPEvidenceService(missing_path).get_evidence()


if __name__ == "__main__":
    unittest.main()
