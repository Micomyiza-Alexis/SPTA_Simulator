import os

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="SPTA Simulator API",
    description="Backend API for the Social Protection Targeting Accuracy Simulator",
    version="0.1.0",
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(credentials: LoginRequest):
    configured_password = os.getenv("DEMO_PASSWORD")

    if not configured_password:
        raise HTTPException(status_code=503, detail="Demo password is not configured on the server.")

    if not credentials.username.strip() or credentials.password != configured_password:
        raise HTTPException(status_code=401, detail="Incorrect demo password.")

    return {"ok": True}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SPTA Simulator API",
        "version": "0.1.0",
    }
