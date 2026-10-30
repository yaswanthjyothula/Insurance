"""Analytics from what really happened: stored assessments, saved plans, bookings and tracked events. Nothing is estimated or invented."""

import csv
import hashlib
import io
import json
from collections import Counter
from typing import Any, Dict, List, Optional

from app.pack.loader import get_pack
from app.services import customer_account
from app.services.storage import storage_service

EVENT_KINDS = {"assessment_started"}  # the only kind a browser may report; the rest are recorded by the server
SHOWN_PRODUCTS = 6


def actor_key(email: Optional[str]) -> Optional[str]:
    """A one-way key for counting distinct people without storing who they are in the event log."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()[:16] if email else None


def track(kind: str, email: Optional[str] = None, **data: Any) -> None:
    try:
        storage_service.add_event({"kind": kind, "actor": actor_key(email), "data": data})
    except Exception:  # noqa: BLE001 - analytics must never break a customer's request
        import logging

        logging.getLogger("lifesure.analytics").exception("Could not record the %s event", kind)


def _category(product_id: str, fallback: str = "") -> str:
    p = get_pack().products.get(product_id)
    return p.product_type if p else fallback


def _name(product_id: str, fallback: str = "") -> str:
    p = get_pack().products.get(product_id)
    return p.product_name if p else fallback or product_id


def _top(counter: Counter) -> List[Dict[str, Any]]:
    return [
        {"product_id": pid, "product_name": _name(pid), "category": _category(pid), "count": n}
        for pid, n in counter.most_common(SHOWN_PRODUCTS)
    ]


def summary() -> Dict[str, Any]:
    events = storage_service.list_events()
    assessments = storage_service.list_assessments()
    plans = [p.get("plan") for p in storage_service.list_my_plans() if (p.get("plan") or {}).get("items")]
    bookings = [b for b in storage_service.list_bookings() if b.get("status") == "confirmed"]

    started = sum(1 for e in events if e["kind"] == "assessment_started")
    completed = len(assessments)
    recommended = [e for e in events if e["kind"] == "recommendations_viewed"]

    recommended_products: Counter = Counter()
    for e in recommended:
        for pid in e.get("data", {}).get("basket", []):
            recommended_products[pid] += 1
    selected_products: Counter = Counter(item["product_id"] for plan in plans for item in plan["items"])
    category_share = lambda counter: dict(Counter(_category(pid) or "Other" for pid, n in counter.items() for _ in range(n)))  # noqa: E731

    gaps = [a["net_needs"]["net_coverage_gap"] for a in assessments if a.get("net_needs")]
    purchased = [plan.get("total_cover", 0) for plan in plans if plan.get("total_cover")]
    assessed_users = {actor_key(a.get("user_email")) for a in assessments if a.get("user_email")}
    booked_users = {actor_key(b.get("user_email")) for b in bookings}
    converted = assessed_users & booked_users

    return {
        "has_data": bool(events or assessments or plans or bookings),
        "funnel": [
            {"key": "started", "label": "Assessments started", "count": started, "note": "Counted from when tracking began"},
            {"key": "completed", "label": "Assessments completed", "count": completed},
            {
                "key": "recommended",
                "label": "Recommendations viewed",
                "count": len(recommended),
                "note": "Each time the product list was calculated",
            },
            {"key": "selected", "label": "Plans chosen", "count": len(plans)},
            {"key": "booked", "label": "Advisor sessions booked", "count": len(bookings), "note": "Simulated bookings"},
        ],
        "drop_off_percent": round((1 - completed / started) * 100, 1) if started >= completed and started > 0 else None,
        "tracking_note": None
        if started >= completed
        else "Some assessments were completed before start-tracking began, so the drop-off rate is not shown yet.",
        "top_recommended": _top(recommended_products),
        "top_selected": _top(selected_products),
        "category_share": {"recommended": category_share(recommended_products), "selected": category_share(selected_products)},
        "average_coverage_gap": round(sum(gaps) / len(gaps)) if gaps else None,
        "average_coverage_purchased": round(sum(purchased) / len(purchased)) if purchased else None,
        "assessments_with_gap": len(gaps),
        "plans_with_cover": len(purchased),
        "advisor_booking_conversion_percent": round(len(converted) / len(assessed_users) * 100, 1) if assessed_users else None,
        "customers_assessed": len(assessed_users),
        "customers_booked_after_assessment": len(converted),
    }


# ---- leads ----


def _lead(a: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    email = a.get("user_email")
    if not email:
        return None  # an anonymous assessment is not a lead: there is nobody to contact
    inputs, needs = a.get("inputs") or {}, a.get("net_needs") or {}
    pid = customer_account.login_id(email)
    profile = get_pack().profiles.get(pid) if pid else None
    return {
        "assessment_id": a["assessment_id"],
        "saved_at": a.get("saved_at", ""),
        "customer": a.get("user_name") or (profile.full_name if profile else ""),
        "customer_id": pid or "",
        "contact": "" if pid else email,
        "age": inputs.get("age"),
        "annual_income": inputs.get("annual_income"),
        "dependents": inputs.get("dependents_count"),
        "outstanding_liabilities": inputs.get("outstanding_liabilities"),
        "existing_cover": inputs.get("existing_cover"),
        "total_need": needs.get("total_gross_need"),
        "coverage_gap": needs.get("net_coverage_gap"),
        "recommended_cover": needs.get("recommended_cover"),
        "config_version": a.get("config_version", 0),
    }


def leads(q: str = "", limit: int = 200) -> List[Dict[str, Any]]:
    rows = [lead for a in storage_service.list_assessments() if (lead := _lead(a))]
    needle = q.strip().lower()
    if needle:
        rows = [r for r in rows if needle in f"{r['customer']} {r['customer_id']} {r['contact']} {r['assessment_id']}".lower()]
    rows.sort(key=lambda r: r["saved_at"], reverse=True)
    return rows[:limit]


def export_csv(rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return ""
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=list(rows[0]))
    writer.writeheader()
    for row in rows:
        # A cell starting with = + - @ would run as a formula when the CSV is opened in a spreadsheet
        writer.writerow({k: ("'" + v if isinstance(v, str) and v[:1] in ("=", "+", "-", "@") else v) for k, v in row.items()})
    return out.getvalue()


def export_json(rows: List[Dict[str, Any]]) -> str:
    return json.dumps(rows, indent=2)
