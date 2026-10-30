"""LifeSure AI entry point: `python FULL_CODE/main.py` starts the API (host and port from API_HOST / API_PORT, see .env.example).

The FastAPI app lives in backend/app; this file only makes it importable from FULL_CODE/ and runs it.
"""

import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.core.config import settings  # noqa: E402 - needs the backend folder on sys.path first
from app.main import app  # noqa: E402

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT, reload=False)
