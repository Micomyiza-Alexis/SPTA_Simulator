import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.results import router as results_router
from backend.app.api.robustness import router as robustness_router


# Load environment variables from backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


app = FastAPI(
    title="SPTA Simulator API",
    description=(
        "Backend API for the Social Protection "
        "Targeting Accuracy Simulator"
    ),
    version="0.3.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(credentials: LoginRequest):
    configured_password = os.getenv("DEMO_PASSWORD")

    if not configured_password:
        raise HTTPException(
            status_code=503,
            detail="Demo password is not configured on the server.",
        )

    if (
        not credentials.username.strip()
        or credentials.password != configured_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect demo password.",
        )

    return {"ok": True}


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