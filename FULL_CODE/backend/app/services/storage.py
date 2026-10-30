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
from app.services.booking_errors import SlotTakenError

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
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(data, fh, indent=2)
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(tmp, self._path(name))  # atomic: readers see the old file or the new one, never half of either
        except BaseException:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise

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
    @staticmethod
    def _slot_is_held(bookings: Dict[str, Any], slot_id: Optional[str], except_id: str) -> bool:
        return bool(slot_id) and any(
            b.get("status") == "confirmed" and b.get("slot_id") == slot_id and bid != except_id for bid, b in bookings.items()
        )

    def save_booking(self, booking: Dict[str, Any]) -> str:
        """Saves a booking only if nobody else holds its slot. The check and the write happen under one lock."""
        bid = booking["booking_id"]
        with _lock:
            data = self._read("bookings")
            if self._slot_is_held(data, booking.get("slot_id"), bid):
                raise SlotTakenError(booking.get("slot_id"))
            data[bid] = {**booking, "created_at": datetime.now().isoformat(timespec="seconds"), "status": "confirmed"}
            self._write("bookings", data)
        return bid

    def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        return self._read("bookings").get(booking_id)

    def list_bookings(self, email: Optional[str] = None) -> List[Dict[str, Any]]:
        items = list(self._read("bookings").values())
        if email:
            items = [b for b in items if _key(b.get("user_email", "")) == _key(email)]
        return sorted(items, key=lambda b: b.get("created_at", ""), reverse=True)

    def cancel_booking(self, booking_id: str, email: Optional[str] = None, by: str = "customer") -> Optional[Dict[str, Any]]:
        """Cancels a booking. When an email is given the booking must belong to it."""
        with _lock:
            data = self._read("bookings")
            booking = data.get(booking_id)
            if booking is None or (email is not None and _key(booking.get("user_email", "")) != _key(email)):
                return None
            booking["status"] = "cancelled"
            booking["cancelled_by"] = by
            self._write("bookings", data)
            return booking

    def update_booking(self, booking_id: str, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Merges fields into a booking. Callers decide who may do this; this only writes."""
        with _lock:
            data = self._read("bookings")
            booking = data.get(booking_id)
            if booking is None:
                return None
            if "slot_id" in fields and self._slot_is_held(data, fields["slot_id"], booking_id):
                raise SlotTakenError(fields["slot_id"])
            booking.update(fields)
            self._write("bookings", data)
            return booking

    # Chat between the customer and the advisor of one booking
    def add_message(self, booking_id: str, sender_role: str, text: str) -> Dict[str, Any]:
        with _lock:
            data = self._read("messages")
            thread = data.setdefault(booking_id, [])
            message = {
                "id": len(thread) + 1,
                "sender_role": sender_role,
                "text": text,
                "at": datetime.now().isoformat(timespec="seconds"),
            }
            thread.append(message)
            self._write("messages", data)
            return message

    def list_messages(self, booking_id: str, after: int = 0) -> List[Dict[str, Any]]:
        return [m for m in self._read("messages").get(booking_id, []) if m["id"] > after]

    def message_summary(self, booking_ids: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
        """Per booking: how many messages and the last one, for list views."""
        wanted = set(booking_ids) if booking_ids is not None else None
        return {
            bid: {"count": len(t), "last": t[-1]} for bid, t in self._read("messages").items() if t and (wanted is None or bid in wanted)
        }

    # CRM leads, one record per lead
    def list_crm_leads(self) -> List[Dict[str, Any]]:
        return list(self._read("crm_leads").values())

    def get_crm_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        return self._read("crm_leads").get(lead_id)

    def save_crm_lead(self, record: Dict[str, Any]) -> Dict[str, Any]:
        self._upsert("crm_leads", record["lead_id"], record)
        return record

    # Admin configuration (one document: the active config plus its version history) and tracked events
    def get_admin_config(self) -> Optional[Dict[str, Any]]:
        return self._read("admin_config") or None

    def save_admin_config(self, doc: Dict[str, Any]) -> None:
        with _lock:
            self._write("admin_config", doc)

    def add_event(self, event: Dict[str, Any]) -> None:
        with _lock, open(self.root / "events.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(event) + "\n")

    def list_events(self, kinds: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        path = self.root / "events.jsonl"
        if not path.exists():
            return []
        out = []
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if kinds is None or event.get("kind") in kinds:
                out.append(event)
        return out

    def list_assessments(self) -> List[Dict[str, Any]]:
        return list(self._read("assessments").values())

    def list_my_plans(self) -> List[Dict[str, Any]]:
        return list(self._read("my_plans").values())

    # Advisor follow-up tasks
    def list_follow_ups(self, advisor_id: str) -> List[Dict[str, Any]]:
        return [f for f in self._read("follow_ups").values() if f.get("advisor_id") == advisor_id]

    def get_follow_up(self, follow_up_id: str) -> Optional[Dict[str, Any]]:
        return self._read("follow_ups").get(follow_up_id)

    def save_follow_up(self, record: Dict[str, Any]) -> Dict[str, Any]:
        self._upsert("follow_ups", record["follow_up_id"], record)
        return record

    def delete_follow_up(self, follow_up_id: str) -> bool:
        with _lock:
            data = self._read("follow_ups")
            if follow_up_id not in data:
                return False
            del data[follow_up_id]
            self._write("follow_ups", data)
            return True

    # Advisor profile and settings
    def get_advisor_settings(self, advisor_id: str) -> Dict[str, Any]:
        return self._read("advisor_settings").get(advisor_id, {})

    def list_advisor_settings(self) -> Dict[str, Dict[str, Any]]:
        return self._read("advisor_settings")

    def save_advisor_settings(self, advisor_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        self._upsert("advisor_settings", advisor_id, data)
        return data

    def append_audit(self, entry: Dict[str, Any]) -> None:
        with _lock, open(self.root / "audit_log.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

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


def _make_storage():
    """Supabase when it is configured, else the JSON files (local development and the tests)."""
    from app.core import supabase

    if supabase.configured():
        from app.services.supabase_storage import SupabaseStorage

        log.info("Runtime data is stored in Supabase")
        return SupabaseStorage(supabase.get_client())
    return StorageService(settings.STORE_DIR)


storage_service = _make_storage()
