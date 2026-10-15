
from fastapi import APIRouter, HTTPException

from backend.app.schemas.vup_evidence import VUPEvidenceResponse
from backend.app.services.vup_evidence_service import (
    VUPEvidenceUnavailableError,
    vup_evidence_service,
)


router = APIRouter(
    prefix="/api/vup",
    tags=["VUP Evidence"],
)


@router.get("/evidence", response_model=VUPEvidenceResponse)
def get_vup_evidence():
    try:
        return vup_evidence_service.get_evidence()
    except VUPEvidenceUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail="VUP aggregate evidence is currently unavailable.",
        ) from exc
