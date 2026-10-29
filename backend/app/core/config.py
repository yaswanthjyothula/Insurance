import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "LifeSure AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & CORS
    SECRET_KEY: str = os.getenv("SECRET_KEY", "lifesure_super_secret_local_dev_key_must_change_in_prod")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://lifesure-ai.vercel.app"
    ]
    
    # Financial Engine Defaults (Indian context)
    DEFAULT_INFLATION_RATE: float = 0.06  # 6.0% p.a.
    DEFAULT_DISCOUNT_RATE: float = 0.075  # 7.5% p.a. safe debt yield
    DEFAULT_EDU_INFLATION: float = 0.08   # 8.0% p.a.
    DEFAULT_RETIREMENT_AGE: int = 60
    DEFAULT_EMERGENCY_MONTHS: int = 6
    
    # Gemini AI API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
