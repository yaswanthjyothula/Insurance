"""Fills Supabase from the problem pack.

Creates a login for every customer and advisor, and stores their profiles, advisors, assignments and the slot calendar.

    python -m app.seed_supabase --dry-run          show what would be created, touch nothing
    python -m app.seed_supabase                    create or update everything (safe to run again; existing passwords are kept)
    python -m app.seed_supabase --migrate-store    also copy bookings, chat, plans, assessments and scenarios from the local JSON store

Run supabase/schema.sql in the Supabase SQL editor first. People sign in with their customer or advisor ID. The password is the lowercase
first name plus "@123". That rule is for a development project with synthetic data only: change it before real people use the system.
Accounts that already exist in the project and are not in the pack are never touched.
"""

import argparse
import json
import logging
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any, Dict, List

from app.core import supabase
from app.core.config import settings
from app.pack.loader import PackData, load_pack_from_files
from app.services import assignments
from app.services.auth import login_email

log = logging.getLogger("lifesure.seed")
BATCH = 500
WORKERS = 8
RESET_PASSWORDS = False
ADMIN_ID = "adm-0001"


@dataclass(frozen=True)
class Account:
    login_id: str
    email: str
    password: str
    full_name: str
    app_metadata: Dict[str, Any]


def first_name(full_name: str) -> str:
    """'Abhishek Saxena' -> 'abhishek'. Letters only, so a title or punctuation never ends up in a password."""
    word = next((w for w in re.split(r"\s+", full_name.strip()) if re.sub(r"[^A-Za-z]", "", w)), "user")
    return re.sub(r"[^a-z]", "", word.lower())


def password_for(full_name: str) -> str:
    return f"{first_name(full_name)}@123"


def plan_accounts(pack: PackData) -> List[Account]:
    accounts = [
        Account(
            a.advisor_id.lower(),
            login_email(a.advisor_id.lower()),
            password_for(a.advisor_name),
            a.advisor_name,
            {"role": "advisor", "advisor_id": a.advisor_id},
        )
        for a in sorted(pack.advisors.values(), key=lambda a: a.advisor_id)
    ]
    accounts += [
        Account(
            p.profile_id.lower(),
            login_email(p.profile_id.lower()),
            password_for(p.full_name),
            p.full_name,
            {"role": "customer", "profile_id": p.profile_id},
        )
        for p in sorted(pack.profiles.values(), key=lambda p: p.profile_id)
    ]
    accounts.append(Account(ADMIN_ID, login_email(ADMIN_ID), password_for("Admin Console"), "Admin Console", {"role": "admin"}))
    return accounts


def _upsert_user(db: supabase.SupabaseClient, existing: Dict[str, str], acc: Account) -> "tuple[str, str]":
    body = {
        "email": acc.email,
        "password": acc.password,
        "email_confirm": True,
        "user_metadata": {"full_name": acc.full_name},
        "app_metadata": acc.app_metadata,
    }
    if acc.email in existing:
        # An account that exists keeps its password: the person may have changed it. Only --reset-passwords puts the rule back.
        if not RESET_PASSWORDS:
            body.pop("password")
        return acc.login_id, db.update_user(existing[acc.email], body)["id"]
    return acc.login_id, db.create_user(body)["id"]


def seed_accounts(db: supabase.SupabaseClient, accounts: List[Account]) -> Dict[str, str]:
    existing = {u["email"]: u["id"] for u in db.list_users()}
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        return dict(pool.map(lambda acc: _upsert_user(db, existing, acc), accounts))


def advisor_rows(pack: PackData, user_ids: Dict[str, str]) -> List[Dict[str, Any]]:
    rows = []
    for a in pack.advisors.values():
        # The pack's advisors.csv also holds working hours, which the Advisor model does not keep
        rows.append(
            {
                "advisor_id": a.advisor_id,
                "auth_user_id": user_ids.get(a.advisor_id.lower()),
                "advisor_name": a.advisor_name,
                "email": a.email,
                "languages": a.languages,
                "specialisations": a.specialisations,
                "consultation_modes": a.consultation_modes,
                "years_experience": a.years_experience,
                "rating": a.rating,
                "review_count": a.review_count,
            }
        )
    return rows


def customer_rows(pack: PackData, user_ids: Dict[str, str]) -> List[Dict[str, Any]]:
    dealt = assignments.deal(pack)
    return [
        {
            "profile_id": p.profile_id,
            "auth_user_id": user_ids.get(p.profile_id.lower()),
            "advisor_id": dealt[p.profile_id],
            "full_name": p.full_name,
            "data": json.loads(p.model_dump_json(exclude={"advisor_id"})),
        }
        for p in pack.profiles.values()
    ]


def slot_rows(pack: PackData) -> List[Dict[str, Any]]:
    return [s.model_dump() for s in pack.slots]


def _batches(rows: List[Dict[str, Any]]):
    for i in range(0, len(rows), BATCH):
        yield rows[i : i + BATCH]


def migrate_store(db: supabase.SupabaseClient) -> Dict[str, int]:
    """Copies what the local JSON store holds (the file-based prototype data) into Supabase. Local accounts cannot move: they are hashes."""
    counts = {}

    def read(name: str) -> Dict[str, Any]:
        path = settings.STORE_DIR / f"{name}.json"
        return json.loads(path.read_text()) if path.exists() else {}

    for table, name, key in (("assessments", "assessments", "assessment_id"), ("scenarios", "scenarios", "scenario_id")):
        rows = [{key: k, "data": v} for k, v in read(name).items()]
        for chunk in _batches(rows):
            db.upsert(table, chunk, key)
        counts[table] = len(rows)
    plans = [{"user_key": k, "data": v} for k, v in read("my_plans").items()]
    for chunk in _batches(plans):
        db.upsert("my_plans", chunk, "user_key")
    counts["my_plans"] = len(plans)
    bookings = [
        {
            "booking_id": k,
            "advisor_id": v.get("advisor_id"),
            "user_email": (v.get("user_email") or "").lower(),
            "status": v.get("status", "confirmed"),
            "data": v,
        }
        for k, v in read("bookings").items()
    ]
    for chunk in _batches(bookings):
        db.upsert("bookings", chunk, "booking_id")
    counts["bookings"] = len(bookings)
    sent = 0
    known = {b["booking_id"] for b in bookings}
    for booking_id, thread in read("messages").items():
        if booking_id in known and not db.select("messages", {"booking_id": f"eq.{booking_id}", "limit": "1"}):
            db.insert(
                "messages", [{"booking_id": booking_id, "sender_role": m["sender_role"], "text": m["text"], "at": m["at"]} for m in thread]
            )
            sent += len(thread)
    counts["messages"] = sent
    return counts


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="print the plan and change nothing")
    parser.add_argument("--reset-passwords", action="store_true", help="put every existing login's password back to the rule")
    parser.add_argument("--migrate-store", action="store_true", help="also copy the local JSON store into Supabase")
    args = parser.parse_args(argv)
    global RESET_PASSWORDS
    RESET_PASSWORDS = args.reset_passwords
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    pack = load_pack_from_files()
    accounts = plan_accounts(pack)
    print(f"Plan: {len(pack.advisors)} advisors, {len(pack.profiles)} customers, {len(pack.slots)} slots, {len(accounts)} logins")  # noqa: T201
    for acc in (accounts[0], accounts[len(pack.advisors)]):
        print(f"  e.g. sign in as {acc.login_id.upper()} / {acc.password}  ({acc.full_name})")  # noqa: T201
    if args.dry_run:
        return 0
    if not supabase.configured():
        print("SUPABASE_URL and SUPABASE_KEY must be set in backend/.env")  # noqa: T201
        return 1

    db = supabase.get_client()
    try:
        db.select("advisors", {"limit": "1"})
    except supabase.SupabaseError:
        print("The tables do not exist yet. Run supabase/schema.sql in the Supabase SQL editor first.")  # noqa: T201
        return 1
    user_ids = seed_accounts(db, accounts)
    print(f"Logins ready: {len(user_ids)}")  # noqa: T201
    db.upsert("advisors", advisor_rows(pack, user_ids), "advisor_id")
    for chunk in _batches(customer_rows(pack, user_ids)):
        db.upsert("customers", chunk, "profile_id")
    for chunk in _batches(slot_rows(pack)):
        db.upsert("advisor_slots", chunk, "slot_id")
    print(f"Stored: {len(pack.advisors)} advisors, {len(pack.profiles)} customers, {len(pack.slots)} slots")  # noqa: T201
    if args.migrate_store:
        print("Migrated from the local store:", migrate_store(db))  # noqa: T201
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
