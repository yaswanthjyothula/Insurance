"""Append-only audit trail for advisor access to customer data (a JSON line per event locally, a row in Supabase when it is configured).

Entries say who did what to which record. They never hold names, contact details or financial values.
"""

import logging
from datetime import UTC, datetime
from typing import Optional

from app.services.storage import storage_service

log = logging.getLogger("lifesure.audit")


def record(actor_id: str, action: str, target: Optional[str] = None, outcome: str = "ok") -> None:
    at = datetime.now(UTC).isoformat(timespec="seconds")
    entry = {"at": at, "actor": actor_id, "action": action, "target": target, "outcome": outcome}
    try:
        storage_service.append_audit(entry)
    except Exception:  # noqa: BLE001 - an unwritable trail must be noticed, so it is logged loudly rather than swallowed
        log.exception("Could not write the audit log")
