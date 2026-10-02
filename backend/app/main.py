import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .db import ROOT
from .seed import seed
from .api.routes import router
from .api.v2 import router as v2_router

LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.FileHandler(LOG_DIR / "backend.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)


@asynccontextmanager
async def lifespan(app):
    seed()
    yield


app = FastAPI(title="FinPilot API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5174,http://127.0.0.1:5174"
    ).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(router)
app.include_router(v2_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "process_id": os.getpid(),
        "local_run_id": os.getenv("FINPILOT_RUN_ID", ""),
        "version": "1.0.0",
        "ai_mode": (
            "live" if os.getenv("LLM_API_KEY") and os.getenv("LLM_MODEL") else "demo"
        ),
    }


@app.exception_handler(Exception)
async def error_handler(request: Request, exc: Exception):
    logging.exception("Unhandled API error", exc_info=exc)
    return JSONResponse(
        status_code=500, content={"detail": "服务暂时不可用，请稍后重试。"}
    )
