"""The CRM: leads built from what customers actually did, moved through sales stages by administrators.

Leads are created and advanced from real signals (an assessment, a booked advisor, a chosen plan), never invented. A person can also
be added by hand. Administrators own the stage, the owner and the notes: the platform moves a lead forward on its own but never
backwards, and never touches one that is won or lost.
"""

import threading
import time
import uuid
from collections import Counter
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from app.admin import analytics
from app.admin.crm_schemas import (
    STAGE_LABEL,
    STAGES,
    AdvisorRef,
    Lead,
    LeadCard,
    LeadUpdate,
    NewLead,
    Pipeline,
    StageColumn,
)
from app.core.compat import UTC
from app.core.security import AdminUser
from app.pack.loader import get_pack
from app.services import audit, customer_account
from app.services.storage import storage_service

OPEN = ["new", "contacted", "qualified", "proposal"]
RANK = {s: i for i, s in enumerate(STAGES)}
SYNC_TTL_SECONDS = 3  # how long one sync is trusted, so a busy board does not re-read every table on each refresh
_lock = threading.RLock()
_last_sync = 0.0
_last_sync_at = ""


class LeadNotFoundError(Exception):
    pass


class LeadConflictError(Exception):
    """The lead changed since the editor loaded it. The message is safe to show."""


class LeadInvalidError(Exception):
    """The change breaks a CRM rule. The message is safe to show."""


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _parse(iso: str) -> datetime:
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(UTC)
    return d if d.tzinfo else d.replace(tzinfo=UTC)


def _days(since: str) -> int:
    return max(0, (datetime.now(UTC) - _parse(since)).days)


def _owner_name(advisor_id: Optional[str]) -> Optional[str]:
    adv = get_pack().advisors.get(advisor_id or "")
    return adv.advisor_name if adv else None


def _stage_since(rec: Dict[str, Any]) -> str:
    return rec["history"][-1]["at"] if rec["history"] else rec["created_at"]


def _card(rec: Dict[str, Any]) -> LeadCard:
    return LeadCard(
        lead_id=rec["lead_id"],
        name=rec["name"],
        customer_id=rec.get("customer_id", ""),
        contact=rec.get("contact", ""),
        source=rec["source"],
        stage=rec["stage"],
        owner_advisor_id=rec.get("owner_advisor_id"),
        owner_name=_owner_name(rec.get("owner_advisor_id")),
        cover_needed=rec.get("cover_needed"),
        annual_premium=rec.get("annual_premium"),
        created_at=rec["created_at"],
        updated_at=rec["updated_at"],
        days_in_stage=_days(_stage_since(rec)),
        note_count=len(rec.get("notes", [])),
    )


def _lead(rec: Dict[str, Any]) -> Lead:
    return Lead(
        **_card(rec).model_dump(),
        version=rec.get("version", 1),
        assessment_id=rec.get("assessment_id"),
        booked_advisor_id=rec.get("booked_advisor_id"),
        lost_reason=rec.get("lost_reason"),
        inputs=rec.get("inputs", {}),
        notes=rec.get("notes", []),
        history=rec.get("history", []),
    )


def _move(rec: Dict[str, Any], to: str, by: str, note: str = "") -> None:
    rec["history"].append({"at": _now(), "by": by, "from_stage": rec["stage"], "to_stage": to, "note": note})
    rec["stage"] = to


def _new_record(key: str, source: str, name: str, contact: str, customer_id: str = "") -> Dict[str, Any]:
    now = _now()
    rec = {
        "lead_id": str(uuid.uuid4()),
        "customer_key": key,
        "name": name,
        "customer_id": customer_id,
        "contact": contact,
        "source": source,
        "stage": "new",
        "owner_advisor_id": None,
        "cover_needed": None,
        "annual_premium": None,
        "assessment_id": None,
        "booked_advisor_id": None,
        "lost_reason": None,
        "inputs": {},
        "notes": [],
        "history": [{"at": now, "by": "system", "from_stage": None, "to_stage": "new", "note": f"Created from {source}"}],
        "created_at": now,
        "updated_at": now,
        "version": 1,
    }
    return rec


# ---- keeping leads in step with what customers did ----


def _identity(email: str, fallback_name: str) -> Dict[str, str]:
    cid = customer_account.login_id(email)
    profile = get_pack().profiles.get(cid) if cid else None
    return {
        "name": fallback_name or (profile.full_name if profile else email.split("@")[0]),
        "customer_id": cid or "",
        "contact": "" if cid else email,
    }


def sync(force: bool = False) -> str:
    """Creates leads for customers who have done something, and moves them forward on real signals. Safe to run any number of times."""
    global _last_sync, _last_sync_at
    with _lock:
        if not force and time.monotonic() - _last_sync < SYNC_TTL_SECONDS:
            return _last_sync_at
        existing = {r["customer_key"]: r for r in storage_service.list_crm_leads()}
        latest: Dict[str, Dict[str, Any]] = {}
        for a in storage_service.list_assessments():
            email = (a.get("user_email") or "").strip().lower()
            if email and a.get("saved_at", "") >= latest.get(email, {}).get("saved_at", ""):
                latest[email] = a
        bookings: Dict[str, Dict[str, Any]] = {}
        held: set = set()  # customers whose advisor session was actually held, as the advisor recorded it
        for b in storage_service.list_bookings():
            if b.get("status") == "confirmed":
                key = (b.get("user_email") or "").strip().lower()
                bookings.setdefault(key, b)
                if b.get("outcome") == "completed":
                    held.add(key)
        plans = {
            (p.get("email") or "").strip().lower(): p.get("plan")
            for p in storage_service.list_my_plans()
            if (p.get("plan") or {}).get("items")
        }
        for email in sorted(set(latest) | set(bookings)):
            if not email:
                continue
            a, b, plan = latest.get(email), bookings.get(email), plans.get(email)
            rec = existing.get(email)
            created = rec is None
            if created:
                who = _identity(email, (a or {}).get("user_name") or (b or {}).get("user_name") or "")
                rec = _new_record(email, "assessment" if a else "booking", who["name"], who["contact"], who["customer_id"])
            before = (
                rec["stage"],
                rec.get("cover_needed"),
                rec.get("annual_premium"),
                rec.get("assessment_id"),
                rec.get("owner_advisor_id"),
            )
            if a:
                needs, inputs = a.get("net_needs") or {}, a.get("inputs") or {}
                rec["assessment_id"] = a["assessment_id"]
                rec["cover_needed"] = int(needs.get("recommended_cover") or needs.get("net_coverage_gap") or 0) or None
                rec["inputs"] = {
                    k: inputs.get(k)
                    for k in ("age", "annual_income", "dependents_count", "outstanding_liabilities", "existing_cover", "eligible_assets")
                }
            if plan:
                rec["annual_premium"] = int(sum(i.get("total_annual_premium", 0) for i in plan["items"])) or None
            if b:
                rec["booked_advisor_id"] = b.get("advisor_id")
                if not rec.get("owner_advisor_id"):
                    rec["owner_advisor_id"] = b.get("advisor_id")
            # Forward only, and never out of won or lost
            if rec["stage"] in OPEN:
                target = "proposal" if plan else "qualified" if email in held else "contacted" if b else "new"
                reason = {
                    "proposal": "Customer chose a plan",
                    "qualified": "Advisor session completed",
                    "contacted": "Customer booked an advisor",
                }
                if RANK[target] > RANK[rec["stage"]]:
                    _move(rec, target, "system", reason.get(target, ""))
            after = (
                rec["stage"],
                rec.get("cover_needed"),
                rec.get("annual_premium"),
                rec.get("assessment_id"),
                rec.get("owner_advisor_id"),
            )
            if created or before != after:
                rec["updated_at"] = _now()
                rec["version"] = rec.get("version", 1) + (0 if created else 1)
                storage_service.save_crm_lead(rec)
        _last_sync, _last_sync_at = time.monotonic(), _now()
        return _last_sync_at


# ---- reading ----


def _records() -> List[Dict[str, Any]]:
    return storage_service.list_crm_leads()


def pipeline(q: str = "", owner: str = "", source: str = "", per_stage: int = 60) -> Pipeline:
    synced = sync()
    needle = q.strip().lower()
    recs = _records()
    if needle:
        recs = [r for r in recs if needle in f"{r['name']} {r.get('customer_id', '')} {r.get('contact', '')}".lower()]
    if owner == "none":
        recs = [r for r in recs if not r.get("owner_advisor_id")]
    elif owner:
        recs = [r for r in recs if r.get("owner_advisor_id") == owner]
    if source:
        recs = [r for r in recs if r["source"] == source]
    cards = sorted((_card(r) for r in recs), key=lambda c: c.updated_at, reverse=True)
    columns = []
    for stage in STAGES:
        inside = [c for c in cards if c.stage == stage]
        columns.append(
            StageColumn(
                key=stage,  # type: ignore[arg-type]
                label=STAGE_LABEL[stage],
                count=len(inside),
                cover_total=sum(c.cover_needed or 0 for c in inside),
                leads=inside[:per_stage],
            )
        )
    open_cards = [c for c in cards if c.stage in OPEN]
    advisors = [
        AdvisorRef(advisor_id=a.advisor_id, advisor_name=a.advisor_name)
        for a in sorted(get_pack().advisors.values(), key=lambda a: a.advisor_name)
    ]
    return Pipeline(
        stages=columns,
        total_leads=len(cards),
        open_leads=len(open_cards),
        open_cover=sum(c.cover_needed or 0 for c in open_cards),
        advisors=advisors,
        synced_at=synced,
    )


def get(lead_id: str) -> Lead:
    rec = storage_service.get_crm_lead(lead_id)
    if rec is None:
        raise LeadNotFoundError(lead_id)
    return _lead(rec)


# ---- changing ----


def create(req: NewLead, admin: AdminUser) -> Lead:
    if req.owner_advisor_id and req.owner_advisor_id not in get_pack().advisors:
        raise LeadInvalidError("That advisor does not exist.")
    with _lock:
        rec = _new_record(f"manual:{uuid.uuid4()}", "manual", req.name.strip(), req.contact.strip())
        rec["owner_advisor_id"] = req.owner_advisor_id
        rec["cover_needed"] = req.cover_needed
        rec["history"][0]["by"] = admin.email
        if req.note.strip():
            rec["notes"].append({"at": _now(), "by": admin.email, "text": req.note.strip()})
        storage_service.save_crm_lead(rec)
    audit.record(admin.email, "crm.lead.create", target=rec["lead_id"][:8])
    return _lead(rec)


def update(lead_id: str, req: LeadUpdate, admin: AdminUser) -> Lead:
    with _lock:
        rec = storage_service.get_crm_lead(lead_id)
        if rec is None:
            raise LeadNotFoundError(lead_id)
        if req.expected_version is not None and req.expected_version != rec.get("version", 1):
            raise LeadConflictError("This lead was changed by someone else. It has been reloaded.")
        changed: List[str] = []
        if req.name and req.name.strip() != rec["name"]:
            rec["name"] = req.name.strip()
            changed.append("name")
        if req.clear_owner and rec.get("owner_advisor_id"):
            rec["owner_advisor_id"] = None
            changed.append("owner")
        elif req.owner_advisor_id is not None and req.owner_advisor_id != rec.get("owner_advisor_id"):
            if req.owner_advisor_id not in get_pack().advisors:
                raise LeadInvalidError("That advisor does not exist.")
            rec["owner_advisor_id"] = req.owner_advisor_id
            changed.append("owner")
        if req.stage and req.stage != rec["stage"]:
            if req.stage == "lost":
                reason = (req.lost_reason or "").strip()
                if len(reason) < 3:
                    raise LeadInvalidError("Say why the lead was lost, so it can be reported.")
                rec["lost_reason"] = reason
            else:
                rec["lost_reason"] = None
            _move(rec, req.stage, admin.email, rec["lost_reason"] or "")
            changed.append("stage")
        elif req.lost_reason is not None and rec["stage"] == "lost" and len(req.lost_reason.strip()) >= 3:
            rec["lost_reason"] = req.lost_reason.strip()
            changed.append("lost_reason")
        if changed:
            rec["version"] = rec.get("version", 1) + 1
            rec["updated_at"] = _now()
            storage_service.save_crm_lead(rec)
            audit.record(admin.email, f"crm.lead.{'stage' if 'stage' in changed else 'update'}", target=lead_id[:8])
    return _lead(rec)


def add_note(lead_id: str, text: str, admin: AdminUser) -> Lead:
    with _lock:
        rec = storage_service.get_crm_lead(lead_id)
        if rec is None:
            raise LeadNotFoundError(lead_id)
        rec["notes"].append({"at": _now(), "by": admin.email, "text": text.strip()})
        rec["version"] = rec.get("version", 1) + 1
        rec["updated_at"] = _now()
        storage_service.save_crm_lead(rec)
    audit.record(admin.email, "crm.lead.note", target=lead_id[:8])
    return _lead(rec)


# ---- reports and export ----


def reports() -> Dict[str, Any]:
    sync()
    recs = _records()
    total = len(recs)
    reached: Counter = Counter()
    for r in recs:
        seen = {h["to_stage"] for h in r["history"]} | {r["stage"]}
        top = max((RANK[s] for s in seen if s in OPEN or s == "won"), default=0)
        for s in OPEN + ["won"]:
            if RANK[s] <= top:
                reached[s] += 1
    won = [r for r in recs if r["stage"] == "won"]
    lost = [r for r in recs if r["stage"] == "lost"]
    won_days = [(_parse(_won_at(r)) - _parse(r["created_at"])).days for r in won]
    by_advisor: Dict[str, Dict[str, Any]] = {}
    for r in recs:
        key = r.get("owner_advisor_id") or "unassigned"
        row = by_advisor.setdefault(
            key,
            {
                "advisor_id": key,
                "advisor_name": _owner_name(key) or "Unassigned",
                "open": 0,
                "won": 0,
                "lost": 0,
                "open_cover": 0,
                "won_premium": 0,
            },
        )
        if r["stage"] in OPEN:
            row["open"] += 1
            row["open_cover"] += r.get("cover_needed") or 0
        elif r["stage"] == "won":
            row["won"] += 1
            row["won_premium"] += r.get("annual_premium") or 0
        else:
            row["lost"] += 1
    today = date.today()
    days = [(today - timedelta(days=i)) for i in range(29, -1, -1)]
    made = Counter(_parse(r["created_at"]).date() for r in recs)
    ageing = {s: [_days(_stage_since(r)) for r in recs if r["stage"] == s] for s in OPEN}
    return {
        "total_leads": total,
        "open_leads": sum(1 for r in recs if r["stage"] in OPEN),
        "won": len(won),
        "lost": len(lost),
        "win_rate_percent": round(len(won) / (len(won) + len(lost)) * 100, 1) if won or lost else None,
        "overall_conversion_percent": round(len(won) / total * 100, 1) if total else None,
        "average_days_to_win": round(sum(won_days) / len(won_days), 1) if won_days else None,
        "open_cover": sum(r.get("cover_needed") or 0 for r in recs if r["stage"] in OPEN),
        "won_annual_premium": sum(r.get("annual_premium") or 0 for r in won),
        "funnel": [{"key": s, "label": STAGE_LABEL[s], "count": reached[s]} for s in OPEN + ["won"]],
        "by_advisor": sorted(by_advisor.values(), key=lambda x: (-x["open"], x["advisor_name"])),
        "by_source": dict(Counter(r["source"] for r in recs)),
        "lost_reasons": [
            {"reason": k, "count": v}
            for k, v in Counter(r.get("lost_reason", "").strip().lower() for r in lost if r.get("lost_reason")).most_common(8)
        ],
        "created_per_day": [{"date": d.isoformat(), "count": made.get(d, 0)} for d in days],
        "average_days_in_stage": {s: round(sum(v) / len(v), 1) if v else None for s, v in ageing.items()},
    }


def _won_at(rec: Dict[str, Any]) -> str:
    return next((h["at"] for h in reversed(rec["history"]) if h["to_stage"] == "won"), rec["updated_at"])


def export_rows(stage: str = "") -> List[Dict[str, Any]]:
    sync()
    recs = [r for r in _records() if not stage or r["stage"] == stage]
    recs.sort(key=lambda r: r["created_at"])
    return [
        {
            "lead_id": r["lead_id"],
            "name": r["name"],
            "customer_id": r.get("customer_id", ""),
            "contact": r.get("contact", ""),
            "stage": r["stage"],
            "owner": _owner_name(r.get("owner_advisor_id")) or "",
            "source": r["source"],
            "cover_needed": r.get("cover_needed"),
            "annual_premium": r.get("annual_premium"),
            "lost_reason": r.get("lost_reason") or "",
            "notes": len(r.get("notes", [])),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "days_in_stage": _days(_stage_since(r)),
        }
        for r in recs
    ]


def export_csv(rows: List[Dict[str, Any]]) -> str:
    return analytics.export_csv(rows)
