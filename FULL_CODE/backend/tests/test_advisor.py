"""Advisor workspace: who may enter, whose customers they see, and that the dashboard only reports real data."""

import json

import pytest

from app.core import security
from app.core.config import settings
from app.pack.loader import get_pack
from app.services import advisor_dashboard, assignments

API = "/api/v1"


def advisor_headers(client, advisor_id=None):
    body = {"advisor_id": advisor_id} if advisor_id else {}
    session = client.post(f"{API}/auth/demo/advisor", json=body).json()
    return {"Authorization": f"Bearer {session['token']}"}, session


def test_advisor_routes_need_a_session(client):
    assert client.get(f"{API}/advisor/me").status_code == 401
    assert client.get(f"{API}/advisor/dashboard").status_code == 401


def test_customer_session_cannot_use_advisor_routes(client, auth_headers):
    assert client.get(f"{API}/advisor/me", headers=auth_headers).status_code == 403
    assert client.get(f"{API}/advisor/dashboard", headers=auth_headers).status_code == 403


def test_demo_advisor_signs_in_with_role(client):
    headers, session = advisor_headers(client)
    assert session["role"] == "advisor" and session["advisor_id"] in get_pack().advisors
    me = client.get(f"{API}/advisor/me", headers=headers).json()
    assert me["advisor_id"] == session["advisor_id"]
    assert "email" not in me


def test_demo_advisor_rejects_unknown_id(client):
    assert client.post(f"{API}/auth/demo/advisor", json={"advisor_id": "ADV-NOPE"}).status_code == 400


def test_demo_advisor_can_be_turned_off(client, monkeypatch):
    monkeypatch.setattr(settings, "ENABLE_DEMO_LOGIN", False)
    assert client.post(f"{API}/auth/demo/advisor", json={}).status_code == 400
    assert client.get(f"{API}/auth/demo/advisors").json() == []


def test_advisor_email_cannot_be_registered_as_a_customer(client):
    email = next(a.email for a in get_pack().advisors.values() if a.email)
    r = client.post(f"{API}/auth/register", json={"full_name": "Someone Else", "email": email, "password": "longenough123"})
    assert r.status_code == 400


def test_registered_customers_are_never_advisors(client):
    r = client.post(
        f"{API}/auth/register", json={"full_name": "New Customer", "email": "new.customer@example.com", "password": "longenough123"}
    )
    assert r.json()["role"] == "customer"
    assert client.get(f"{API}/advisor/me", headers={"Authorization": f"Bearer {r.json()['token']}"}).status_code == 403


def test_tampered_token_does_not_grant_advisor_role(client, auth_headers):
    token = auth_headers["Authorization"].split()[1]
    payload, signature = token.split(".")
    import base64

    body = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    body.update(role="advisor", adv=next(iter(get_pack().advisors)))
    forged = base64.urlsafe_b64encode(json.dumps(body).encode()).decode().rstrip("=") + "." + signature
    assert security.verify_token(forged) is None
    assert client.get(f"{API}/advisor/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


def test_tokens_without_a_role_are_customers():
    user = security.verify_token(security.issue_token("a@b.co", "A"))
    assert user is not None and user.role == "customer" and user.advisor_id is None


def test_every_customer_has_exactly_one_advisor():
    pack = get_pack()
    seen = []
    for advisor_id in pack.advisors:
        seen += [p.profile_id for p in assignments.customers_for(advisor_id)]
    assert sorted(seen) == sorted(pack.profiles)


def test_advisor_only_gets_their_own_customers():
    pack = get_pack()
    first, second = sorted(pack.advisors)[:2]
    other = assignments.customers_for(second)[0]
    assert assignments.get_assigned(first, other.profile_id) is None
    assert assignments.get_assigned(second, other.profile_id) is not None


@pytest.mark.parametrize(
    ("gap", "gross", "band"),
    [
        (0, 100, "covered"),
        (-5, 100, "covered"),
        (20, 100, "small"),
        (25, 100, "small"),
        (40, 100, "moderate"),
        (61, 100, "large"),
        (10, 0, "large"),
    ],
)
def test_gap_bands(gap, gross, band):
    assert advisor_dashboard.gap_band(gap, gross) == band


def test_dashboard_reports_real_counts_and_flags_untracked_data(client):
    headers, session = advisor_headers(client)
    data = client.get(f"{API}/advisor/dashboard", headers=headers).json()
    assigned = len(assignments.customers_for(session["advisor_id"]))
    kpis = {k["key"]: k for k in data["kpis"]}
    assert kpis["customers"]["value"] == assigned
    assert sum(b["count"] for b in data["gap_distribution"]) == assigned
    assert data["total_protection_gap_inr"] >= 0
    # Only figures the platform really holds are shown
    assert set(kpis) == {"customers", "appointments", "to_update", "follow_ups"}
    assert kpis["follow_ups"]["value"] == 0
    assert len(data["appointment_load"]) == advisor_dashboard.LOAD_DAYS


def test_dashboard_shows_only_own_bookings_without_contact_details(client, auth_headers):
    pack = get_pack()
    mine, theirs = sorted(pack.advisors)[:2]
    availability = client.get(f"{API}/advisory/availability").json()["advisors"]
    adv = next(a for a in availability if a["advisor_id"] == mine and a["slots"])
    mode = adv["consultation_modes"][0]
    booked = client.post(
        f"{API}/advisory/bookings",
        headers=auth_headers,
        json={
            "advisor_id": mine,
            "slot_id": adv["slots"][0]["slot_id"],
            "user_name": "Asha Verma",
            "user_phone": "9876543210",
            "consultation_mode": mode,
        },
    )
    assert booked.status_code == 200

    own, _ = advisor_headers(client, mine)
    other, _ = advisor_headers(client, theirs)
    seen = client.get(f"{API}/advisor/dashboard", headers=own).json()
    unseen = client.get(f"{API}/advisor/dashboard", headers=other).json()

    assert any(a["customer_name"] == "Asha Verma" and a["simulated"] for a in seen["upcoming_appointments"])
    assert not any(a["customer_name"] == "Asha Verma" for a in unseen["upcoming_appointments"])
    raw = json.dumps(seen)
    assert "9876543210" not in raw and "demo.customer@saffronbank.example" not in raw


def test_dashboard_views_are_audited(client):
    headers, session = advisor_headers(client)
    client.get(f"{API}/advisor/dashboard", headers=headers)
    lines = (settings.STORE_DIR / "audit_log.jsonl").read_text().splitlines()
    entry = json.loads(lines[-1])
    assert entry["actor"] == session["advisor_id"] and entry["action"] == "dashboard.view"
    assert set(entry) == {"at", "actor", "action", "target", "outcome"}


# ---- Customer book ----


def _two_advisors():
    first, second = sorted(get_pack().advisors)[:2]
    return first, second


def test_customer_list_is_paginated_and_only_mine(client):
    mine, _ = _two_advisors()
    headers, _ = advisor_headers(client, mine)
    owned = {p.profile_id for p in assignments.customers_for(mine)}
    page1 = client.get(f"{API}/advisor/customers", params={"page_size": 5}, headers=headers).json()
    assert page1["total"] == len(owned) and len(page1["items"]) == 5 and page1["pages"] == -(-len(owned) // 5)
    seen = set()
    for n in range(1, page1["pages"] + 1):
        seen |= {
            c["profile_id"]
            for c in client.get(f"{API}/advisor/customers", params={"page_size": 5, "page": n}, headers=headers).json()["items"]
        }
    assert seen == owned


def test_customer_list_search_filter_and_sort(client):
    mine, _ = _two_advisors()
    headers, _ = advisor_headers(client, mine)
    everyone = client.get(f"{API}/advisor/customers", params={"page_size": 50}, headers=headers).json()["items"]
    target = everyone[0]
    found = client.get(f"{API}/advisor/customers", params={"q": target["full_name"].split()[0].upper()}, headers=headers).json()
    assert any(c["profile_id"] == target["profile_id"] for c in found["items"])
    large = client.get(f"{API}/advisor/customers", params={"band": "large", "page_size": 50}, headers=headers).json()["items"]
    assert large and all(c["gap_band"] == "large" for c in large)
    by_gap = client.get(f"{API}/advisor/customers", params={"sort": "gap", "order": "desc", "page_size": 50}, headers=headers).json()[
        "items"
    ]
    gaps = [c["net_coverage_gap_inr"] for c in by_gap]
    assert gaps == sorted(gaps, reverse=True)


@pytest.mark.parametrize("bad", [{"page": 0}, {"page_size": 500}, {"sort": "salary"}, {"band": "huge"}, {"q": "x" * 200}])
def test_customer_list_rejects_bad_queries(client, bad):
    headers, _ = advisor_headers(client)
    assert client.get(f"{API}/advisor/customers", params=bad, headers=headers).status_code == 422


def test_customer_routes_refuse_customers_and_guests(client, auth_headers):
    pid = next(iter(get_pack().profiles))
    for path in ("/advisor/customers", f"/advisor/customers/{pid}"):
        assert client.get(f"{API}{path}").status_code == 401
        assert client.get(f"{API}{path}", headers=auth_headers).status_code == 403


def test_advisor_cannot_open_another_advisors_customer(client):
    mine, theirs = _two_advisors()
    headers, _ = advisor_headers(client, mine)
    foreign = assignments.customers_for(theirs)[0].profile_id
    refused = client.get(f"{API}/advisor/customers/{foreign}", headers=headers)
    missing = client.get(f"{API}/advisor/customers/CUS-DOES-NOT-EXIST", headers=headers)
    assert refused.status_code == missing.status_code == 404
    assert refused.json() == missing.json()  # no way to tell "not yours" from "not real"
    entry = json.loads((settings.STORE_DIR / "audit_log.jsonl").read_text().splitlines()[-2])
    assert entry["action"] == "customer.view" and entry["outcome"] == "denied" and entry["target"] == foreign


def test_customer_detail_matches_the_needs_engine(client):
    from app.services.financial_engine import FinancialEngine
    from app.services.profiles import to_assessment_input

    mine, _ = _two_advisors()
    headers, _ = advisor_headers(client, mine)
    profile = assignments.customers_for(mine)[0]
    data = client.get(f"{API}/advisor/customers/{profile.profile_id}", headers=headers).json()
    expected = FinancialEngine.assess(to_assessment_input(profile))
    assert data["analysis"]["net_needs"] == expected.net_needs.model_dump()
    assert data["analysis"]["hlv"] == expected.hlv.model_dump()
    # Existing cover is counted once: individual + employer cover, exactly what the engine deducts
    fin = data["financial"]
    assert fin["individual_cover_inr"] + fin["employer_group_cover_inr"] == data["analysis"]["net_needs"]["existing_cover_deducted"]
    assert data["overview"]["assigned_advisor_id"] == mine
    raw = json.dumps(data)
    assert "health_conditions" not in raw and "bmi" not in raw


def test_viewing_a_customer_creates_no_assessment_record(client):
    from app.services.storage import storage_service

    mine, _ = _two_advisors()
    headers, _ = advisor_headers(client, mine)
    before = len(storage_service._read("assessments"))
    client.get(f"{API}/advisor/customers/{assignments.customers_for(mine)[0].profile_id}", headers=headers)
    assert len(storage_service._read("assessments")) == before


# ---- Appointments and chat ----


def _book(client, headers, advisor_id, mode="video", name="Asha Verma", phone="9876543210", slot_index=0):
    adv = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == advisor_id)
    slot = adv["slots"][slot_index]
    mode = mode if mode in adv["consultation_modes"] else adv["consultation_modes"][0]
    r = client.post(
        f"{API}/advisory/bookings",
        headers=headers,
        json={
            "advisor_id": advisor_id,
            "slot_id": slot["slot_id"],
            "user_name": name,
            "user_phone": phone,
            "consultation_mode": mode,
            "notes": "Term plan?",
        },
    )
    assert r.status_code == 200
    return r.json(), mode, slot


def test_booking_shows_up_for_the_advisor_with_the_right_contact_details(client, auth_headers):
    mine, _ = _two_advisors()
    booking, mode, _ = _book(client, auth_headers, mine, mode="phone")
    own, _ = advisor_headers(client, mine)
    listed = client.get(f"{API}/advisor/appointments", headers=own).json()
    assert any(a["booking_id"] == booking["booking_id"] for a in listed)
    detail = client.get(f"{API}/advisor/appointments/{booking['booking_id']}", headers=own).json()
    assert detail["customer_note"] == "Term plan?" and detail["slot_end"]
    if mode == "phone":
        assert detail["customer_phone"] == "9876543210" and detail["meeting_link"] is None
    else:
        assert detail["customer_phone"] is None


def test_phone_number_is_withheld_for_non_phone_consultations(client, auth_headers):
    mine, _ = _two_advisors()
    booking, mode, _ = _book(client, auth_headers, mine, mode="chat", slot_index=1)
    own, _ = advisor_headers(client, mine)
    detail = client.get(f"{API}/advisor/appointments/{booking['booking_id']}", headers=own).json()
    if mode != "phone":
        assert detail["customer_phone"] is None


def test_other_advisors_cannot_see_or_touch_an_appointment(client, auth_headers):
    mine, theirs = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=2)
    other, _ = advisor_headers(client, theirs)
    bid = booking["booking_id"]
    assert not any(a["booking_id"] == bid for a in client.get(f"{API}/advisor/appointments?scope=all", headers=other).json())
    for method, path, body in [
        ("get", f"/advisor/appointments/{bid}", None),
        ("put", f"/advisor/appointments/{bid}/notes", {"advisor_notes": "x"}),
        ("post", f"/advisor/appointments/{bid}/cancel", None),
        ("get", f"/advisor/appointments/{bid}/messages", None),
        ("post", f"/advisor/appointments/{bid}/messages", {"text": "hi"}),
        ("post", f"/advisor/appointments/{bid}/reschedule", {"slot_id": "x"}),
    ]:
        r = getattr(client, method)(f"{API}{path}", headers=other, **({"json": body} if body else {}))
        assert r.status_code == 404, path


def test_chat_is_shared_between_customer_and_advisor(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=3)
    bid = booking["booking_id"]
    own, _ = advisor_headers(client, mine)
    assert client.post(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers, json={"text": "Hello advisor"}).status_code == 200
    assert client.post(f"{API}/advisor/appointments/{bid}/messages", headers=own, json={"text": "Hello Asha"}).status_code == 200
    seen_by_customer = client.get(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers).json()
    seen_by_advisor = client.get(f"{API}/advisor/appointments/{bid}/messages", headers=own).json()
    assert seen_by_customer == seen_by_advisor
    assert [m["sender_role"] for m in seen_by_customer] == ["customer", "advisor"]
    later = client.get(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers, params={"after": 1}).json()
    assert [m["text"] for m in later] == ["Hello Asha"]
    summary = next(a for a in client.get(f"{API}/advisor/appointments", headers=own).json() if a["booking_id"] == bid)
    assert summary["message_count"] == 2 and summary["last_message_preview"] == "Hello Asha"


def test_a_customer_cannot_read_or_write_someone_elses_chat(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=4)
    bid = booking["booking_id"]
    token = client.post(
        f"{API}/auth/register", json={"full_name": "Other Person", "email": "other.person@example.com", "password": "longenough123"}
    ).json()["token"]
    stranger = {"Authorization": f"Bearer {token}"}
    assert client.get(f"{API}/advisory/bookings/{bid}/messages", headers=stranger).status_code == 404
    assert client.post(f"{API}/advisory/bookings/{bid}/messages", headers=stranger, json={"text": "hi"}).status_code == 404
    assert client.get(f"{API}/advisory/bookings/{bid}/messages").status_code == 401


@pytest.mark.parametrize("text", ["", "x" * 1001])
def test_chat_message_length_is_validated(client, auth_headers, text):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=5)
    assert (
        client.post(f"{API}/advisory/bookings/{booking['booking_id']}/messages", headers=auth_headers, json={"text": text}).status_code
        == 422
    )


def test_reschedule_moves_the_booking_for_both_sides_and_frees_the_old_slot(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, old_slot = _book(client, auth_headers, mine, slot_index=6)
    bid = booking["booking_id"]
    own, _ = advisor_headers(client, mine)
    options = client.get(f"{API}/advisor/appointments/{bid}/slots", headers=own).json()
    assert old_slot["slot_id"] not in {s["slot_id"] for s in options}
    target = options[0]
    moved = client.post(f"{API}/advisor/appointments/{bid}/reschedule", headers=own, json={"slot_id": target["slot_id"]})
    assert moved.status_code == 200 and moved.json()["slot_label"] == target["label"] and moved.json()["rescheduled"]
    mine_list = client.get(f"{API}/advisory/bookings", headers=auth_headers).json()
    assert next(b for b in mine_list if b["booking_id"] == bid)["slot_label"] == target["label"]
    assert old_slot["slot_id"] in {s["slot_id"] for s in client.get(f"{API}/advisor/appointments/{bid}/slots", headers=own).json()}
    thread = client.get(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers).json()
    assert thread[-1]["sender_role"] == "system" and target["label"] in thread[-1]["text"]
    # The same slot cannot be taken twice, and slots that do not exist are refused
    assert client.post(f"{API}/advisor/appointments/{bid}/reschedule", headers=own, json={"slot_id": "NOPE"}).status_code == 409


def test_cancelling_closes_the_chat_and_tells_the_customer(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=7)
    bid = booking["booking_id"]
    own, _ = advisor_headers(client, mine)
    assert client.post(f"{API}/advisor/appointments/{bid}/cancel", headers=own).json()["cancelled_by"] == "advisor"
    mine_list = client.get(f"{API}/advisory/bookings", headers=auth_headers).json()
    assert next(b for b in mine_list if b["booking_id"] == bid)["cancelled_by"] == "advisor"
    assert client.post(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers, json={"text": "still there?"}).status_code == 409
    assert client.post(f"{API}/advisor/appointments/{bid}/messages", headers=own, json={"text": "sorry"}).status_code == 409
    assert client.post(f"{API}/advisor/appointments/{bid}/cancel", headers=own).status_code == 409
    assert client.post(f"{API}/advisor/appointments/{bid}/reschedule", headers=own, json={"slot_id": "x"}).status_code == 409


def test_advisor_notes_are_private_to_the_advisor(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=8)
    bid = booking["booking_id"]
    own, _ = advisor_headers(client, mine)
    saved = client.put(f"{API}/advisor/appointments/{bid}/notes", headers=own, json={"advisor_notes": "Prefers evenings"})
    assert saved.json()["advisor_notes"] == "Prefers evenings"
    assert "Prefers evenings" not in json.dumps(client.get(f"{API}/advisory/bookings", headers=auth_headers).json())
    assert "Prefers evenings" not in json.dumps(client.get(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers).json())
    assert client.put(f"{API}/advisor/appointments/{bid}/notes", headers=own, json={"advisor_notes": "x" * 3000}).status_code == 422


def test_appointment_routes_refuse_customers_and_guests(client, auth_headers):
    assert client.get(f"{API}/advisor/appointments").status_code == 401
    assert client.get(f"{API}/advisor/appointments", headers=auth_headers).status_code == 403
    assert client.get(f"{API}/advisor/appointments", headers=advisor_headers(client)[0], params={"scope": "weird"}).status_code == 422


def test_appointments_say_whether_they_are_upcoming(client, auth_headers):
    mine, _ = _two_advisors()
    booking, _, _ = _book(client, auth_headers, mine, slot_index=9)
    own, _ = advisor_headers(client, mine)
    row = next(a for a in client.get(f"{API}/advisor/appointments", headers=own).json() if a["booking_id"] == booking["booking_id"])
    assert row["phase"] == "upcoming" and row["starts_in_minutes"] > 0
    client.post(f"{API}/advisor/appointments/{booking['booking_id']}/cancel", headers=own)
    row = next(
        a for a in client.get(f"{API}/advisor/appointments?scope=cancelled", headers=own).json() if a["booking_id"] == booking["booking_id"]
    )
    assert row["phase"] == "cancelled"


# ---- one holder per slot, and recording how a session went ----


def _slot(client, advisor_id, index=0):
    adv = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == advisor_id)
    return adv["slots"][index]["slot_id"], adv["consultation_modes"][0]


def _book_slot(client, headers, advisor_id, slot_id, mode, name="Asha Verma"):
    return client.post(
        f"{API}/advisory/bookings",
        headers=headers,
        json={"advisor_id": advisor_id, "slot_id": slot_id, "user_name": name, "user_phone": "9876543210", "consultation_mode": mode},
    )


def _second_customer(client, n=1):
    token = client.post(
        f"{API}/auth/register", json={"full_name": f"Second Customer {n}", "email": f"second.{n}@example.com", "password": "longenough123"}
    ).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_a_booked_slot_disappears_for_everyone_else_and_cannot_be_booked(client, auth_headers):
    advisor_id = sorted(get_pack().advisors)[0]
    slot_id, mode = _slot(client, advisor_id, 10)
    assert _book_slot(client, auth_headers, advisor_id, slot_id, mode).status_code == 200
    adv = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == advisor_id)
    assert slot_id not in {s["slot_id"] for s in adv["slots"]}
    other = _second_customer(client, 1)
    refused = _book_slot(client, other, advisor_id, slot_id, mode, "Ravi Kumar")
    assert refused.status_code == 409 and "just taken" in refused.json()["detail"]


def test_two_customers_pressing_book_at_once_cannot_both_get_the_slot(client, auth_headers):
    import threading

    advisor_id = sorted(get_pack().advisors)[0]
    slot_id, mode = _slot(client, advisor_id, 11)
    people = [auth_headers] + [_second_customer(client, n) for n in range(2, 8)]
    results, gate = [], threading.Barrier(len(people))

    def go(headers):
        gate.wait()
        results.append(_book_slot(client, headers, advisor_id, slot_id, mode).status_code)

    threads = [threading.Thread(target=go, args=(h,)) for h in people]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(results) == [200] + [409] * (len(people) - 1)


def test_storage_refuses_a_second_confirmed_booking_for_a_slot():
    from app.services.booking_errors import SlotTakenError
    from app.services.storage import storage_service

    store = storage_service
    store.save_booking({"booking_id": "race-a", "slot_id": "SLT-RACE", "advisor_id": "A", "user_email": "a@x.co"})
    with pytest.raises(SlotTakenError):
        store.save_booking({"booking_id": "race-b", "slot_id": "SLT-RACE", "advisor_id": "A", "user_email": "b@x.co"})
    store.cancel_booking("race-a")
    store.save_booking({"booking_id": "race-b", "slot_id": "SLT-RACE", "advisor_id": "A", "user_email": "b@x.co"})  # freed by the cancel
    with pytest.raises(SlotTakenError):
        store.save_booking({"booking_id": "race-c", "slot_id": "SLT-RACE", "advisor_id": "A", "user_email": "c@x.co"})


def test_a_cancelled_booking_frees_the_slot_for_the_next_customer(client, auth_headers):
    advisor_id = sorted(get_pack().advisors)[0]
    slot_id, mode = _slot(client, advisor_id, 12)
    first = _book_slot(client, auth_headers, advisor_id, slot_id, mode).json()
    client.post(f"{API}/advisory/bookings/{first['booking_id']}/cancel", headers=auth_headers)
    assert _book_slot(client, _second_customer(client, 9), advisor_id, slot_id, mode, "Ravi Kumar").status_code == 200


def test_an_advisor_cannot_move_a_session_into_a_slot_someone_else_holds(client, auth_headers):
    advisor_id = sorted(get_pack().advisors)[0]
    a_slot, mode = _slot(client, advisor_id, 13)
    b_slot, _ = _slot(client, advisor_id, 14)
    mine = _book_slot(client, auth_headers, advisor_id, a_slot, mode).json()
    _book_slot(client, _second_customer(client, 10), advisor_id, b_slot, mode, "Ravi Kumar")
    own, _ = advisor_headers(client, advisor_id)
    assert (
        client.post(f"{API}/advisor/appointments/{mine['booking_id']}/reschedule", headers=own, json={"slot_id": b_slot}).status_code == 409
    )


@pytest.fixture()
def started(monkeypatch):
    """The demo clock, moved to just after a booking's start, so the session has been held."""
    from datetime import datetime, timedelta

    from app.services import advisory

    def move_to(slot_start):
        when = datetime.strptime(slot_start, advisory.SLOT_FORMAT) + timedelta(minutes=45)
        monkeypatch.setattr(advisory, "reference_now", lambda: when)

    return move_to


def test_an_advisor_marks_a_held_session_completed_and_everyone_sees_it(client, auth_headers, started):
    advisor_id = sorted(get_pack().advisors)[0]
    slot_id, mode = _slot(client, advisor_id, 15)
    booking = _book_slot(client, auth_headers, advisor_id, slot_id, mode).json()
    bid, own = booking["booking_id"], advisor_headers(client, advisor_id)[0]
    early = client.post(f"{API}/advisor/appointments/{bid}/outcome", headers=own, json={"outcome": "completed"})
    assert early.status_code == 409 and "about to start" in early.json()["detail"]
    started(booking["slot_start"])
    row = next(a for a in client.get(f"{API}/advisor/appointments?scope=past", headers=own).json() if a["booking_id"] == bid)
    assert row["phase"] == "past" and row["outcome"] is None  # held, waiting for the advisor to say how it went
    kpis = {k["key"]: k["value"] for k in client.get(f"{API}/advisor/dashboard", headers=own).json()["kpis"]}
    assert kpis["to_update"] >= 1
    done = client.post(
        f"{API}/advisor/appointments/{bid}/outcome", headers=own, json={"outcome": "completed", "note": "Chose the term plan"}
    )
    assert done.status_code == 200 and done.json()["phase"] == "completed" and done.json()["outcome_note"] == "Chose the term plan"
    mine = next(b for b in client.get(f"{API}/advisory/bookings", headers=auth_headers).json() if b["booking_id"] == bid)
    assert mine["phase"] == "completed" and mine["outcome"] == "completed"
    thread = client.get(f"{API}/advisory/bookings/{bid}/messages", headers=auth_headers).json()
    assert thread[-1]["sender_role"] == "system" and "completed" in thread[-1]["text"]
    assert client.get(f"{API}/advisor/appointments?scope=upcoming", headers=own).json() == []


def test_an_outcome_can_be_corrected_but_a_cancelled_session_has_none(client, auth_headers, started):
    advisor_id = sorted(get_pack().advisors)[0]
    slot_id, mode = _slot(client, advisor_id, 16)
    booking = _book_slot(client, auth_headers, advisor_id, slot_id, mode).json()
    bid, own = booking["booking_id"], advisor_headers(client, advisor_id)[0]
    started(booking["slot_start"])
    assert client.post(f"{API}/advisor/appointments/{bid}/outcome", headers=own, json={"outcome": "no_show"}).json()["phase"] == "no_show"
    assert (
        client.post(f"{API}/advisor/appointments/{bid}/outcome", headers=own, json={"outcome": "completed"}).json()["phase"] == "completed"
    )
    for bad in ({"outcome": "maybe"}, {"outcome": "completed", "note": "x" * 501}, {}):
        assert client.post(f"{API}/advisor/appointments/{bid}/outcome", headers=own, json=bad).status_code == 422
    other_slot, _ = _slot(client, advisor_id, 17)
    cancelled = _book_slot(client, _second_customer(client, 11), advisor_id, other_slot, mode, "Ravi Kumar").json()
    client.post(f"{API}/advisor/appointments/{cancelled['booking_id']}/cancel", headers=own)
    started(cancelled["slot_start"])
    assert (
        client.post(f"{API}/advisor/appointments/{cancelled['booking_id']}/outcome", headers=own, json={"outcome": "completed"}).status_code
        == 409
    )


def test_only_the_booked_advisor_can_record_an_outcome(client, auth_headers, started):
    mine, theirs = sorted(get_pack().advisors)[:2]
    slot_id, mode = _slot(client, mine, 18)
    booking = _book_slot(client, auth_headers, mine, slot_id, mode).json()
    started(booking["slot_start"])
    other, _ = advisor_headers(client, theirs)
    assert (
        client.post(f"{API}/advisor/appointments/{booking['booking_id']}/outcome", headers=other, json={"outcome": "completed"}).status_code
        == 404
    )
    assert (
        client.post(
            f"{API}/advisor/appointments/{booking['booking_id']}/outcome", headers=auth_headers, json={"outcome": "completed"}
        ).status_code
        == 403
    )
