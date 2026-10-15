
import json
from pathlib import Path

from pydantic import ValidationError

from backend.app.schemas.vup_evidence import VUPEvidenceResponse


ROOT = Path(__file__).resolve().parents[3]
VUP_EVIDENCE_PATH = (
    ROOT / "data" / "processed" / "vup_evidence_summary.json"
)


class VUPEvidenceUnavailableError(RuntimeError):
    """Raised when aggregate evidence cannot be safely served."""


class VUPEvidenceService:
    """Serve validated aggregate VUP evidence, never raw microdata."""

    def __init__(self, path: Path = VUP_EVIDENCE_PATH) -> None:
        self.path = path

    def get_evidence(self) -> dict:
        try:
            with self.path.open("r", encoding="utf-8") as file:
                payload = json.load(file)

            # Validate the complete payload before returning it.
            if hasattr(VUPEvidenceResponse, "model_validate"):
                validated = VUPEvidenceResponse.model_validate(payload)
                return validated.model_dump()

            # Pydantic v1 compatibility.
            validated = VUPEvidenceResponse.parse_obj(payload)
            return validated.dict()

        except (FileNotFoundError, json.JSONDecodeError,
                UnicodeDecodeError, ValidationError, OSError) as exc:
            raise VUPEvidenceUnavailableError(
                "VUP aggregate evidence is unavailable or invalid."
            ) from exc


vup_evidence_service = VUPEvidenceService()
