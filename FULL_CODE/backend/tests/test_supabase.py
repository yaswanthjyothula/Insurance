"""The Supabase layer, tested against a fake HTTP server so nothing reaches a real project."""

import json

import httpx
import pytest

from app import seed_supabase as seed
from app.core.supabase import SupabaseClient, SupabaseError
from app.pack.loader import load_pack_from_files
from app.schemas.auth import LoginRequest
from app.services import assignments
from app.services.auth import INTERNAL_DOMAIN, login_email
from app.services.supabase_storage import SupabaseStorage


class FakeSupabase:
    """Just enough of PostgREST: tables of dict rows with eq/gt/in filters, identity ids and upsert."""

    def __init__(self):
        self.tables = {}
        self.next_id = 0
        self.users = []
        self.calls = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.calls.append((request.method, request.url.path))
        path = request.url.path
        if path.startswith("/auth/v1/admin/users"):
            return self._auth(request, path)
        table = path.rsplit("/", 1)[-1]
        rows = self.tables.setdefault(table, [])
        params = dict(request.url.params)
        body = json.loads(request.content) if request.content else None
        if request.method == "GET":
            return httpx.Response(200, json=self._page(self._filter(rows, params), params))
        if request.method == "POST":
            items = body if isinstance(body, list) else [body]
            out = []
            conflict = params.get("on_conflict")
            for item in items:
                existing = next((r for r in rows if conflict and r.get(conflict) == item.get(conflict)), None)
                if existing:
                    existing.update(item)
                    out.append(existing)
                else:
                    row = {**item}
                    if table == "messages":
                        self.next_id += 1
                        row["id"], row["at"] = self.next_id, "2026-10-31T10:00:00+00:00"
                    rows.append(row)
                    out.append(row)
            return httpx.Response(201, json=out)
        if request.method == "PATCH":
            hit = self._filter(rows, params)
            for r in hit:
                r.update(body)
            return httpx.Response(200, json=hit)
        if request.method == "DELETE":
            hit = self._filter(rows, params)
            rows[:] = [r for r in rows if r not in hit]
            return httpx.Response(200, json=hit)
        return httpx.Response(405)

    def _auth(self, request, path):
        body = json.loads(request.content) if request.content else {}
        if request.method == "GET":
            return httpx.Response(200, json={"users": self.users})
        if request.method == "POST":
            if any(u["email"] == body["email"] for u in self.users):
                return httpx.Response(422, json={"msg": "exists"})
            user = {"id": f"uid-{len(self.users) + 1}", **body}
            self.users.append(user)
            return httpx.Response(200, json=user)
        uid = path.rsplit("/", 1)[-1]
        user = next(u for u in self.users if u["id"] == uid)
        user.update(body)
        return httpx.Response(200, json=user)

    @staticmethod
    def _filter(rows, params):
        out = list(rows)
        for col, cond in params.items():
            if col in {"select", "order", "limit", "offset", "on_conflict"}:
                continue
            op, _, val = cond.partition(".")
            if op == "eq":
                out = [r for r in out if str(r.get(col)) == val]
            elif op == "gt":
                out = [r for r in out if r.get(col, 0) > int(val)]
            elif op == "in":
                out = [r for r in out if r.get(col) in val.strip("()").split(",")]
        return out

    @staticmethod
    def _page(rows, params):
        start = int(params.get("offset", 0))
        end = start + int(params["limit"]) if "limit" in params else None
        return rows[start:end]


@pytest.fixture()
def fake():
    return FakeSupabase()


@pytest.fixture()
def db(fake):
    return SupabaseClient("https://x.supabase.co", "service-key", httpx.Client(transport=httpx.MockTransport(fake.handler)))


@pytest.fixture(scope="module")
def pack():
    return load_pack_from_files()


# ---- accounts and passwords ----


@pytest.mark.parametrize(
    ("name", "password"),
    [
        ("Abhishek Saxena", "abhishek@123"),
        ("Venkata Subba Rao", "venkata@123"),
        ("Farah Siddiqui", "farah@123"),
        ("Dr. Meera Iyer", "dr@123"),
    ],
)
def test_password_is_first_name_at_123(name, password):
    assert seed.password_for(name) == password


def test_every_customer_and_advisor_gets_one_login(pack):
    accounts = seed.plan_accounts(pack)
    assert len(accounts) == len(pack.profiles) + len(pack.advisors) + 1  # plus the admin
    assert len({a.email for a in accounts}) == len(accounts)
    assert all(a.email.endswith(f"@{INTERNAL_DOMAIN}") and len(a.password) >= 6 for a in accounts)


def test_roles_live_in_app_metadata_for_the_right_people(pack):
    accounts = {a.login_id: a for a in seed.plan_accounts(pack)}
    advisor = accounts["adv-4kkbrk"]
    assert advisor.app_metadata == {"role": "advisor", "advisor_id": "ADV-4KKBRK"}
    customer = next(a for a in accounts.values() if a.login_id.startswith("cus-"))
    assert customer.app_metadata["role"] == "customer"


def test_ids_sign_in_through_their_internal_address():
    assert login_email("cus-06isggsq") == f"cus-06isggsq@{INTERNAL_DOMAIN}"
    assert login_email("a@b.co") == "a@b.co"
    assert LoginRequest(email=" CUS-06ISGGSQ ", password="x").email == "cus-06isggsq"
    assert LoginRequest(email="A@B.co", password="x").email == "a@b.co"
    with pytest.raises(ValueError):
        LoginRequest(email="not an id", password="x")


def test_seeding_creates_then_updates_without_duplicating(db, fake, pack):
    accounts = seed.plan_accounts(pack)[:5]
    first = seed.seed_accounts(db, accounts)
    again = seed.seed_accounts(db, accounts)
    assert first == again and len(fake.users) == 5
    assert fake.users[0]["email_confirm"] is True


def test_seeding_leaves_other_accounts_alone(db, fake, pack):
    fake.users.append({"id": "someone-else", "email": "real.person@gmail.com"})
    seed.seed_accounts(db, seed.plan_accounts(pack)[:3])
    assert next(u for u in fake.users if u["id"] == "someone-else") == {"id": "someone-else", "email": "real.person@gmail.com"}


def test_customers_are_stored_with_their_advisor_and_without_a_duplicate_advisor_field(pack):
    rows = seed.customer_rows(pack, {})
    assert len(rows) == 200 and all(r["advisor_id"] in pack.advisors for r in rows)
    assert "advisor_id" not in rows[0]["data"]
    assert {r["advisor_id"] for r in rows} == set(pack.advisors)
    assert [r["advisor_id"] for r in rows] == [assignments.deal(pack)[r["profile_id"]] for r in rows]


# ---- storage ----


def test_bookings_roundtrip_filter_and_cancel(db):
    store = SupabaseStorage(db)
    store.save_booking({"booking_id": "b1", "advisor_id": "ADV-1", "user_email": "A@x.co", "slot_start": "2026-11-01T10:00:00"})
    store.save_booking({"booking_id": "b2", "advisor_id": "ADV-1", "user_email": "b@x.co", "slot_start": "2026-11-02T10:00:00"})
    assert [b["booking_id"] for b in store.list_bookings("a@x.co")] == ["b1"]
    assert store.cancel_booking("b1", "someone@else.co") is None
    cancelled = store.cancel_booking("b1", "a@x.co", by="advisor")
    assert cancelled["status"] == "cancelled" and cancelled["cancelled_by"] == "advisor"
    assert store.get_booking("b1")["status"] == "cancelled"
    assert store.update_booking("b2", {"advisor_notes": "hi"})["advisor_notes"] == "hi"
    assert store.update_booking("nope", {}) is None


def test_chat_ids_increase_and_after_filters(db):
    store = SupabaseStorage(db)
    store.save_booking({"booking_id": "b1", "advisor_id": "A", "user_email": "a@x.co"})
    first = store.add_message("b1", "customer", "hello")
    second = store.add_message("b1", "advisor", "hi")
    assert second["id"] > first["id"]
    assert [m["text"] for m in store.list_messages("b1", after=first["id"])] == ["hi"]
    summary = store.message_summary(["b1"])
    assert summary["b1"]["count"] == 2 and summary["b1"]["last"]["text"] == "hi"
    assert store.message_summary([]) == {}


def test_plan_merge_and_choice_removal(db):
    store = SupabaseStorage(db)
    store.save_my_plan("A@x.co", {"assessment": {"n": 1}})
    merged = store.save_my_plan("a@x.co", {"plan": {"p": 1}})
    assert merged["assessment"] == {"n": 1} and merged["plan"] == {"p": 1}
    assert store.delete_my_plan_choice("a@x.co") is True
    assert "plan" not in store.get_my_plan("a@x.co")
    assert store.delete_my_plan_choice("nobody@x.co") is False


def test_audit_rows_hold_no_extra_fields(db, fake):
    SupabaseStorage(db).append_audit(
        {"at": "x", "actor": "ADV-1", "action": "customer.view", "target": "CUS-1", "outcome": "ok", "extra": "no"}
    )
    assert set(fake.tables["audit_log"][0]) == {"actor", "action", "target", "outcome"}


def test_a_failed_call_raises_a_clean_error():
    client = SupabaseClient(
        "https://x.supabase.co", "k", httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(401, text="bad key")))
    )
    with pytest.raises(SupabaseError, match="401"):
        client.select("advisors")


def test_large_tables_are_read_in_pages(db, fake):
    fake.tables["advisor_slots"] = [{"slot_id": str(i)} for i in range(2500)]
    assert len(db.select_all("advisor_slots")) == 2500


def test_tables_added_later_read_as_empty_until_the_schema_is_run():
    def handler(request):
        return httpx.Response(404, json={"code": "PGRST205", "message": "Could not find the table"})

    store = SupabaseStorage(SupabaseClient("https://x.supabase.co", "k", httpx.Client(transport=httpx.MockTransport(handler))))
    assert store.list_follow_ups("ADV-1") == [] and store.list_advisor_settings() == {} and store.get_advisor_settings("ADV-1") == {}
    with pytest.raises(SupabaseError):
        store.save_follow_up({"follow_up_id": "x", "advisor_id": "ADV-1"})


def test_follow_ups_and_settings_roundtrip(db):
    store = SupabaseStorage(db)
    store.save_follow_up({"follow_up_id": "f1", "advisor_id": "ADV-1", "title": "a"})
    store.save_follow_up({"follow_up_id": "f2", "advisor_id": "ADV-2", "title": "b"})
    assert [f["follow_up_id"] for f in store.list_follow_ups("ADV-1")] == ["f1"]
    assert store.get_follow_up("f2")["title"] == "b" and store.get_follow_up("nope") is None
    assert store.delete_follow_up("f1") is True and store.delete_follow_up("f1") is False
    store.save_advisor_settings("ADV-1", {"bio": "hi"})
    assert store.get_advisor_settings("ADV-1") == {"bio": "hi"} and store.list_advisor_settings() == {"ADV-1": {"bio": "hi"}}


def test_an_existing_login_keeps_its_password_unless_asked(db, fake, pack):
    accounts = seed.plan_accounts(pack)[:2]
    seed.seed_accounts(db, accounts)
    fake.users[0]["password"] = "changed-by-the-person"
    seed.seed_accounts(db, accounts)
    assert fake.users[0]["password"] == "changed-by-the-person"
    seed.RESET_PASSWORDS = True
    try:
        seed.seed_accounts(db, accounts)
    finally:
        seed.RESET_PASSWORDS = False
    assert fake.users[0]["password"] == accounts[0].password


def test_the_admin_account_has_the_admin_role(pack):
    admin = next(a for a in seed.plan_accounts(pack) if a.login_id == "adm-0001")
    assert admin.app_metadata == {"role": "admin"} and admin.password == "admin@123"
