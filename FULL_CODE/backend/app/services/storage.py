"""Small JSON-file store for runtime data (saved plans, bookings, scenarios). It is a prototype store: not for production use.

Writes are atomic and guarded by a lock so two requests cannot corrupt a file. Files live in STORE_DIR and are never committed.
"""

import json
import logging
import os
import tempfile
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings

log = logging.getLogger("lifesure.storage")
_lock = threading.Lock()


def _key(email: str) -> str:
    return (email or "").strip().lower()


class StorageService:
    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, name: str) -> Path:
        return self.root / f"{name}.json"

    def _read(self, name: str) -> Dict[str, Any]:
        path = self._path(name)
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            log.exception("Could not read %s, treating it as empty", path.name)
            return {}

    def _write(self, name: str, data: Dict[str, Any]) -> None:
        fd, tmp = tempfile.mkstemp(dir=self.root, suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
        os.replace(tmp, self._path(name))

    def _upsert(self, name: str, key: str, value: Dict[str, Any]) -> None:
        with _lock:
            data = self._read(name)
            data[key] = value
            self._write(name, data)

    # Assessments
    def save_assessment(self, assessment: Dict[str, Any]) -> str:
        aid = assessment.get("assessment_id") or str(uuid.uuid4())
        self._upsert(
            "assessments",
            aid,
            {**assessment, "assessment_id": aid, "saved_at": datetime.now().isoformat(timespec="seconds")},
        )
        return aid

    def get_assessment(self, aid: str) -> Optional[Dict[str, Any]]:
        return self._read("assessments").get(aid)

    # Scenarios
    def save_scenario(self, scenario: Dict[str, Any]) -> str:
        sid = scenario.get("scenario_id") or str(uuid.uuid4())
        self._upsert("scenarios", sid, {**scenario, "scenario_id": sid, "saved_at": datetime.now().isoformat(timespec="seconds")})
        return sid

    def list_scenarios(self) -> List[Dict[str, Any]]:
        return list(self._read("scenarios").values())

    def delete_scenario(self, sid: str) -> bool:
        with _lock:
            data = self._read("scenarios")
            if sid not in data:
                return False
            del data[sid]
            self._write("scenarios", data)
            return True

    # Bookings
    def save_booking(self, booking: Dict[str, Any]) -> str:
        bid = booking["booking_id"]
        self._upsert(
            "bookings",
            bid,
            {**booking, "created_at": datetime.now().isoformat(timespec="seconds"), "status": "confirmed"},
        )
        return bid

    def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        return self._read("bookings").get(booking_id)

    def list_bookings(self, email: Optional[str] = None) -> List[Dict[str, Any]]:
        items = list(self._read("bookings").values())
        if email:
            items = [b for b in items if _key(b.get("user_email", "")) == _key(email)]
        return sorted(items, key=lambda b: b.get("created_at", ""), reverse=True)

    def cancel_booking(self, booking_id: str, email: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Cancels a booking. When an email is given the booking must belong to it."""
        with _lock:
            data = self._read("bookings")
            booking = data.get(booking_id)
            if booking is None or (email is not None and _key(booking.get("user_email", "")) != _key(email)):
                return None
            booking["status"] = "cancelled"
            self._write("bookings", data)
            return booking

    # Local accounts (used only when Supabase is not configured)
    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        return self._read("users").get(_key(email))

    def save_user(self, email: str, record: Dict[str, Any]) -> None:
        self._upsert("users", _key(email), record)

    # Each signed-in user's saved plan
    def save_my_plan(self, email: str, plan: Dict[str, Any]) -> Dict[str, Any]:
        key = _key(email)
        with _lock:
            data = self._read("my_plans")
            merged = {
                **data.get(key, {}),
                **plan,
                "email": key,
                "updated_at": datetime.now().isoformat(timespec="seconds"),
            }
            data[key] = merged
            self._write("my_plans", data)
        return merged

    def get_my_plan(self, email: str) -> Optional[Dict[str, Any]]:
        return self._read("my_plans").get(_key(email))

    def delete_my_plan_choice(self, email: str) -> bool:
        key = _key(email)
        with _lock:
            data = self._read("my_plans")
            if key not in data:
                return False
            data[key].pop("plan", None)
            data[key]["updated_at"] = datetime.now().isoformat(timespec="seconds")
            self._write("my_plans", data)
        return True


storage_service = StorageService(settings.STORE_DIR)
