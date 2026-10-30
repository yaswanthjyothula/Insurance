"""Runtime data in Supabase Postgres, with the same methods as the JSON-file StorageService so the rest of the app does not change.

Rows keep the full record as JSON (`data`) next to a few columns used for filtering. Bookings and messages are shared by the customer and
advisor apps, so they live here rather than in a file on one server.
"""

import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.supabase import SupabaseClient, SupabaseError
from app.services.booking_errors import SlotTakenError

log = logging.getLogger("lifesure.supabase")


def _key(email: str) -> str:
    return (email or "").strip().lower()


def _or_when_table_missing(call, fallback):
    """A table added after the first setup may not exist yet.

    Reads then behave as empty, with a warning, until db/schema.sql is run.
    """
    try:
        return call()
    except SupabaseError as exc:
        if not exc.missing_table:
            raise
        log.warning("A Supabase table is missing, so it reads as empty. Run db/schema.sql again. (%s)", exc)
        return fallback


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


class SupabaseStorage:
    def __init__(self, client: SupabaseClient):
        self.db = client

    def _get(self, table: str, column: str, value: str) -> Optional[Dict[str, Any]]:
        rows = self.db.select(table, {column: f"eq.{value}", "limit": "1"})
        return rows[0] if rows else None

    # Assessments
    def save_assessment(self, assessment: Dict[str, Any]) -> str:
        aid = assessment.get("assessment_id") or str(uuid.uuid4())
        self.db.upsert(
            "assessments", {"assessment_id": aid, "data": {**assessment, "assessment_id": aid, "saved_at": _now()}}, "assessment_id"
        )
        return aid

    def get_assessment(self, aid: str) -> Optional[Dict[str, Any]]:
        row = self._get("assessments", "assessment_id", aid)
        return row["data"] if row else None

    # Scenarios
    def save_scenario(self, scenario: Dict[str, Any]) -> str:
        sid = scenario.get("scenario_id") or str(uuid.uuid4())
        self.db.upsert("scenarios", {"scenario_id": sid, "data": {**scenario, "scenario_id": sid, "saved_at": _now()}}, "scenario_id")
        return sid

    def list_scenarios(self) -> List[Dict[str, Any]]:
        return [r["data"] for r in self.db.select("scenarios", {"order": "saved_at.desc"})]

    def delete_scenario(self, sid: str) -> bool:
        return bool(self.db.delete("scenarios", {"scenario_id": f"eq.{sid}"}))

    # Bookings
    def save_booking(self, booking: Dict[str, Any]) -> str:
        """The database allows one confirmed booking per slot (a unique index), so two customers cannot both get it."""
        record = {**booking, "created_at": _now(), "status": "confirmed"}
        try:
            self.db.insert(
                "bookings",
                {
                    "booking_id": record["booking_id"],
                    "advisor_id": record.get("advisor_id"),
                    "user_email": _key(record.get("user_email", "")),
                    "status": "confirmed",
                    "data": record,
                },
            )
        except SupabaseError as exc:
            if exc.duplicate:
                raise SlotTakenError(record.get("slot_id")) from exc
            raise
        return record["booking_id"]

    def get_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        row = self._get("bookings", "booking_id", booking_id)
        return row["data"] if row else None

    def list_bookings(self, email: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"order": "created_at.desc"}
        if email:
            params["user_email"] = f"eq.{_key(email)}"
        return [r["data"] for r in self.db.select_all("bookings", params)]

    def _write_booking(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        self.db.update(
            "bookings", {"booking_id": f"eq.{booking['booking_id']}"}, {"status": booking.get("status", "confirmed"), "data": booking}
        )
        return booking

    def cancel_booking(self, booking_id: str, email: Optional[str] = None, by: str = "customer") -> Optional[Dict[str, Any]]:
        booking = self.get_booking(booking_id)
        if booking is None or (email is not None and _key(booking.get("user_email", "")) != _key(email)):
            return None
        return self._write_booking({**booking, "status": "cancelled", "cancelled_by": by})

    def update_booking(self, booking_id: str, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        booking = self.get_booking(booking_id)
        if booking is None:
            return None
        try:
            return self._write_booking({**booking, **fields})
        except SupabaseError as exc:
            if exc.duplicate:
                raise SlotTakenError(fields.get("slot_id")) from exc
            raise

    # Chat
    def add_message(self, booking_id: str, sender_role: str, text: str) -> Dict[str, Any]:
        row = self.db.insert("messages", {"booking_id": booking_id, "sender_role": sender_role, "text": text})[0]
        return {"id": row["id"], "sender_role": row["sender_role"], "text": row["text"], "at": row["at"]}

    def list_messages(self, booking_id: str, after: int = 0) -> List[Dict[str, Any]]:
        rows = self.db.select_all("messages", {"booking_id": f"eq.{booking_id}", "id": f"gt.{after}", "order": "id.asc"})
        return [{"id": r["id"], "sender_role": r["sender_role"], "text": r["text"], "at": r["at"]} for r in rows]

    def message_summary(self, booking_ids: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
        if booking_ids is not None and not booking_ids:
            return {}
        params = {"order": "id.asc", "select": "id,booking_id,text,at"}
        if booking_ids is not None:
            params["booking_id"] = "in.(" + ",".join(booking_ids) + ")"
        summary: Dict[str, Dict[str, Any]] = {}
        for r in self.db.select_all("messages", params):
            entry = summary.setdefault(r["booking_id"], {"count": 0, "last": None})
            entry["count"] += 1
            entry["last"] = {"id": r["id"], "text": r["text"], "at": r["at"]}
        return summary

    # Accounts live in Supabase Auth when it is configured, so there is no local account store here
    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        return None

    def save_user(self, email: str, record: Dict[str, Any]) -> None:
        raise NotImplementedError("Accounts are kept in Supabase Auth")

    # Each signed-in user's saved plan
    def save_my_plan(self, email: str, plan: Dict[str, Any]) -> Dict[str, Any]:
        key = _key(email)
        existing = self.get_my_plan(email) or {}
        merged = {**existing, **plan, "email": key, "updated_at": _now()}
        self.db.upsert("my_plans", {"user_key": key, "data": merged}, "user_key")
        return merged

    def get_my_plan(self, email: str) -> Optional[Dict[str, Any]]:
        row = self._get("my_plans", "user_key", _key(email))
        return row["data"] if row else None

    def delete_my_plan_choice(self, email: str) -> bool:
        current = self.get_my_plan(email)
        if current is None:
            return False
        current.pop("plan", None)
        current["updated_at"] = _now()
        self.db.upsert("my_plans", {"user_key": _key(email), "data": current}, "user_key")
        return True

    # CRM leads. Until the table exists (db/schema.sql) they are kept in a local file, so the CRM works either way.
    _crm_missing_until = 0.0

    def _crm(self, remote, local):
        if time.monotonic() >= self._crm_missing_until:
            try:
                return remote()
            except SupabaseError as exc:
                if not exc.missing_table:
                    raise
                log.warning("The crm_leads table is missing, so leads are kept in a local file. Run db/schema.sql.")
                self._crm_missing_until = time.monotonic() + 60
        return local()

    def list_crm_leads(self) -> List[Dict[str, Any]]:
        return self._crm(lambda: [r["data"] for r in self.db.select_all("crm_leads")], lambda: self._local().list_crm_leads())

    def get_crm_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        def remote():
            row = self._get("crm_leads", "lead_id", lead_id)
            return row["data"] if row else None

        return self._crm(remote, lambda: self._local().get_crm_lead(lead_id))

    def save_crm_lead(self, record: Dict[str, Any]) -> Dict[str, Any]:
        def remote():
            self.db.upsert(
                "crm_leads",
                {
                    "lead_id": record["lead_id"],
                    "customer_key": record["customer_key"],
                    "stage": record["stage"],
                    "owner_advisor_id": record.get("owner_advisor_id"),
                    "data": record,
                    "updated_at": _now(),
                },
                "lead_id",
            )
            return record

        return self._crm(remote, lambda: self._local().save_crm_lead(record))

    # Admin configuration and tracked events. Until the tables exist (db/schema.sql) they fall back to local files, so the admin
    # console keeps working; once they exist, Supabase is the store.
    def _local(self):
        from app.core.config import settings
        from app.services.storage import StorageService

        if not hasattr(self, "_fallback"):
            self._fallback = StorageService(settings.STORE_DIR)
        return self._fallback

    _admin_table_missing_until = 0.0

    def get_admin_config(self) -> Optional[Dict[str, Any]]:
        if time.monotonic() < self._admin_table_missing_until:
            return self._local().get_admin_config()
        row = _or_when_table_missing(lambda: self._get("admin_config", "config_id", "active"), None)
        return row["data"] if row else self._local().get_admin_config()

    def save_admin_config(self, doc: Dict[str, Any]) -> None:
        if time.monotonic() >= self._admin_table_missing_until:
            try:
                self.db.upsert("admin_config", {"config_id": "active", "data": doc, "updated_at": _now()}, "config_id")
                return
            except SupabaseError as exc:
                if not exc.missing_table:
                    raise
                log.warning("The admin_config table is missing, so the configuration is saved to a local file. Run db/schema.sql.")
                self._admin_table_missing_until = time.monotonic() + 60  # do not retry a failing call on every save
        self._local().save_admin_config(doc)

    def add_event(self, event: Dict[str, Any]) -> None:
        try:
            self.db.insert("analytics_events", {"kind": event["kind"], "actor": event.get("actor"), "data": event.get("data", {})})
        except SupabaseError as exc:
            if not exc.missing_table:
                raise
            self._local().add_event(event)

    def list_events(self, kinds: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        params = {"order": "id.asc"}
        if kinds:
            params["kind"] = "in.(" + ",".join(kinds) + ")"
        rows = _or_when_table_missing(lambda: self.db.select_all("analytics_events", params), None)
        if rows is None:
            return self._local().list_events(kinds)
        return [{"kind": r["kind"], "actor": r.get("actor"), "data": r.get("data") or {}, "at": r["at"]} for r in rows]

    def list_assessments(self) -> List[Dict[str, Any]]:
        return [r["data"] for r in self.db.select_all("assessments", {"order": "saved_at.desc"})]

    def list_my_plans(self) -> List[Dict[str, Any]]:
        return [r["data"] for r in self.db.select_all("my_plans")]

    # Advisor follow-up tasks
    def list_follow_ups(self, advisor_id: str) -> List[Dict[str, Any]]:
        rows = _or_when_table_missing(lambda: self.db.select_all("follow_ups", {"advisor_id": f"eq.{advisor_id}"}), [])
        return [r["data"] for r in rows]

    def get_follow_up(self, follow_up_id: str) -> Optional[Dict[str, Any]]:
        row = self._get("follow_ups", "follow_up_id", follow_up_id)
        return row["data"] if row else None

    def save_follow_up(self, record: Dict[str, Any]) -> Dict[str, Any]:
        self.db.upsert(
            "follow_ups", {"follow_up_id": record["follow_up_id"], "advisor_id": record["advisor_id"], "data": record}, "follow_up_id"
        )
        return record

    def delete_follow_up(self, follow_up_id: str) -> bool:
        return bool(self.db.delete("follow_ups", {"follow_up_id": f"eq.{follow_up_id}"}))

    # Advisor profile and settings
    def get_advisor_settings(self, advisor_id: str) -> Dict[str, Any]:
        row = _or_when_table_missing(lambda: self._get("advisor_settings", "advisor_id", advisor_id), None)
        return row["data"] if row else {}

    def list_advisor_settings(self) -> Dict[str, Dict[str, Any]]:
        rows = _or_when_table_missing(lambda: self.db.select_all("advisor_settings"), [])
        return {r["advisor_id"]: r["data"] for r in rows}

    def save_advisor_settings(self, advisor_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        self.db.upsert("advisor_settings", {"advisor_id": advisor_id, "data": data, "updated_at": _now()}, "advisor_id")
        return data

    # Audit
    def append_audit(self, entry: Dict[str, Any]) -> None:
        self.db.insert("audit_log", {k: entry.get(k) for k in ("actor", "action", "target", "outcome")})
