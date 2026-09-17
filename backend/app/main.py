from fastapi import FastAPI

app = FastAPI(
    title="SPTA Simulator API",
    description="Backend API for the Social Protection Targeting Accuracy Simulator",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SPTA Simulator API",
        "version": "0.1.0",
    }
