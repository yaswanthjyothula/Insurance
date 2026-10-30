"""Reads a free-text life change into numeric changes with Gemini, validates the reply, and falls back to simple rules if needed.

The model only says WHICH inputs change. Cover and premiums are always computed by the deterministic engines.
"""

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.financial import AssessmentInput
from app.schemas.scenario_reading import ScenarioReading
from app.services import scenario_heuristic

log = logging.getLogger("lifesure.llm")
PROMPTS = Path(__file__).resolve().parents[1] / "prompts"
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
RETRY_STATUS = {429, 500, 502, 503, 504}
ATTEMPTS_PER_MODEL = 2

_PII = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[email]"),
    (re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)"), "[phone]"),
    (re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), "[id number]"),
    (re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"), "[id number]"),
]


def mask_personal_data(text: str) -> str:
    """Removes emails, phone numbers and ID numbers before anything is sent to an outside service."""
    for pattern, token in _PII:
        text = pattern.sub(token, text)
    return text


def _build_prompt(text: str, base: AssessmentInput) -> str:
    user = (
        (PROMPTS / "scenario_user.txt")
        .read_text(encoding="utf-8")
        .format(
            age=base.age,
            annual_income=base.annual_income,
            annual_expenses=base.annual_expenses,
            dependents=base.dependents_count,
            liabilities=base.outstanding_liabilities,
            assets=base.eligible_assets,
            retirement_age=base.retirement_age or 60,
            customer_text=mask_personal_data(text).replace("<", "(").replace(">", ")"),
        )
    )
    return (PROMPTS / "scenario_system.txt").read_text(encoding="utf-8") + "\n\n" + user


async def _call(client: httpx.AsyncClient, model: str, prompt: str) -> Dict[str, Any]:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": settings.GEMINI_TEMPERATURE,
            "responseMimeType": "application/json",
            "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
        },
    }
    resp = await client.post(URL.format(model=model), json=payload, headers={"x-goog-api-key": settings.GEMINI_API_KEY})
    resp.raise_for_status()
    return json.loads(resp.json()["candidates"][0]["content"]["parts"][0]["text"])


async def _ask_models(prompt: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT_SECONDS) as client:
        for model in settings.GEMINI_MODELS:
            for attempt in range(ATTEMPTS_PER_MODEL):
                try:
                    reading = ScenarioReading(**await _call(client, model, prompt))
                    return {**reading.model_dump(), "model_used": model}
                except httpx.HTTPStatusError as exc:
                    log.warning("Gemini %s returned %s (attempt %d)", model, exc.response.status_code, attempt + 1)
                    if exc.response.status_code not in RETRY_STATUS:
                        break
                except (httpx.TimeoutException, httpx.TransportError) as exc:
                    log.warning("Gemini %s network problem: %s (attempt %d)", model, type(exc).__name__, attempt + 1)
                except (ValueError, KeyError, IndexError, ValidationError):
                    log.warning("Gemini %s returned an unusable reply (attempt %d)", model, attempt + 1)
                    break
                await asyncio.sleep(0.5 * 2**attempt)
    return {}


async def interpret(text: str, base: AssessmentInput) -> Dict[str, Any]:
    # 1. Pre-validation: check prompt relevance before calling LLM
    cleaned = mask_personal_data(text).strip()
    if not scenario_heuristic.is_relevant_scenario(cleaned):
        return scenario_heuristic.read_scenario(cleaned, base)

    # 2. Call constrained Gemini model
    if settings.GEMINI_API_KEY:
        result = await _ask_models(_build_prompt(text, base))
        if result:
            return result
        log.warning("Falling back to the built-in scenario reader")
    return scenario_heuristic.read_scenario(text, base)
