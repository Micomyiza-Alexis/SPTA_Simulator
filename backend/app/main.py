from fastapi import FastAPI

from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.results import router as results_router
from backend.app.api.robustness import router as robustness_router

app = FastAPI(
    title="SPTA Simulator API",
    description=(
        "Backend API for the Social Protection "
        "Targeting Accuracy Simulator"
    ),
    version="0.3.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SPTA Simulator API",
        "version": "0.3.0",
    }

app.include_router(results_router)
app.include_router(robustness_router)
app.include_router(dashboard_router)