"""All settings in one place. Values come from environment variables (see .env.example); nothing secret is hard-coded."""

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_FULL_CODE_DIR = _BACKEND_DIR.parent
load_dotenv(_FULL_CODE_DIR / ".env")
load_dotenv(_BACKEND_DIR / ".env")


def _csv_env(name: str, default: str) -> List[str]:
    return [v.strip() for v in os.getenv(name, default).split(",") if v.strip()]


class Settings(BaseModel):
    PROJECT_NAME: str = "LifeSure AI API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Where the problem pack's CSV/JSON files live (not committed) and where runtime data is written (not committed)
    DATA_DIR: Path = Path(os.getenv("LIFESURE_DATA_DIR", str(_FULL_CODE_DIR / "data")))
    STORE_DIR: Path = Path(os.getenv("LIFESURE_STORE_DIR", str(_BACKEND_DIR / "data_store")))

    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    SESSION_TTL_HOURS: int = int(os.getenv("SESSION_TTL_HOURS", "12"))
    BACKEND_CORS_ORIGINS: List[str] = _csv_env("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

    # LLM (scenario reading). The key stays on the server and is never sent to the browser.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODELS: List[str] = _csv_env("GEMINI_MODELS", "gemini-3.1-flash-lite,gemini-3.5-flash-lite")
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    GEMINI_TIMEOUT_SECONDS: float = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))
    GEMINI_MAX_OUTPUT_TOKENS: int = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1024"))
    LLM_REQUESTS_PER_MINUTE: int = int(os.getenv("LLM_REQUESTS_PER_MINUTE", "10"))

    ENABLE_DEMO_LOGIN: bool = os.getenv("ENABLE_DEMO_LOGIN", "true").lower() == "true"
    # Supabase is called only from the server (auth proxy). Empty means local accounts only.
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")


settings = Settings()
