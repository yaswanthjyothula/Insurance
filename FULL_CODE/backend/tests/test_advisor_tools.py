"""Follow-ups, advisor profile and settings, and the customer's own profile and settings."""

import json
from datetime import date, timedelta

import pytest

from app.core import security
from app.pack.loader import get_pack
from app.services import assignments, auth

API = "/api/v1"


def advisor(client, advisor_id=None):
    body = {"advisor_id": advisor_id} if advisor_id else {}
    session = client.post(f"{API}/auth/demo/advisor", json=body).json()
    return {"Authorization": f"Bearer {session['token']}"}, session["advisor_id"]


def two():
    return sorted(get_pack().advisors)[:2]


def due(days):
    return (date.today() + timedelta(days=days)).isoformat()


# ---- follow-ups ----


def test_follow_up_lifecycle(client):
    mine, _ = two()
    h, aid = advisor(client, mine)
    customer = assignments.customers_for(aid)[0]
    made = client.post(
        f"{API}/advisor/follow-ups",
        headers=h,
        json={
            "title": "Send rider options",
            "note": "after call",
            "due_date": due(2),
            "priority": "high",
            "profile_id": customer.profile_id,
        },
    )
    assert made.status_code == 201
    item = made.json()
    assert item["status"] == "open" and item["customer_name"] == customer.full_name and item["days_until_due"] == 2 and not item["overdue"]
    done = client.put(f"{API}/advisor/follow-ups/{item['follow_up_id']}", headers=h, json={"status": "done"}).json()
    assert done["status"] == "done" and done["completed_at"]
    reopened = client.put(
        f"{API}/advisor/follow-ups/{item['follow_up_id']}", headers=h, json={"status": "open", "title": "Send options"}
    ).json()
    assert reopened["completed_at"] is None and reopened["title"] == "Send options"
    assert client.delete(f"{API}/advisor/follow-ups/{item['follow_up_id']}", headers=h).status_code == 204
    assert client.get(f"{API}/advisor/follow-ups?scope=all", headers=h).json() == []


def test_scopes_overdue_and_ordering(client):
    mine, _ = two()
    h, _ = advisor(client, mine)
    for title, days, prio in [("late", -3, "low"), ("soon high", 1, "high"), ("soon low", 1, "low"), ("later", 9, "medium")]:
        client.post(f"{API}/advisor/follow-ups", headers=h, json={"title": title, "due_date": due(days), "priority": prio})
    open_titles = [f["title"] for f in client.get(f"{API}/advisor/follow-ups?scope=open", headers=h).json()]
    assert open_titles == ["late", "soon high", "soon low", "later"]
    overdue = client.get(f"{API}/advisor/follow-ups?scope=overdue", headers=h).json()
    assert [f["title"] for f in overdue] == ["late"] and overdue[0]["overdue"] and overdue[0]["days_until_due"] == -3
    late = overdue[0]["follow_up_id"]
    client.put(f"{API}/advisor/follow-ups/{late}", headers=h, json={"status": "done"})
    assert client.get(f"{API}/advisor/follow-ups?scope=overdue", headers=h).json() == []
    assert [f["title"] for f in client.get(f"{API}/advisor/follow-ups?scope=done", headers=h).json()] == ["late"]
    for f in client.get(f"{API}/advisor/follow-ups?scope=all", headers=h).json():
        client.delete(f"{API}/advisor/follow-ups/{f['follow_up_id']}", headers=h)


def test_follow_ups_are_private_to_their_advisor(client):
    mine, theirs = two()
    h, _ = advisor(client, mine)
    other, _ = advisor(client, theirs)
    item = client.post(f"{API}/advisor/follow-ups", headers=h, json={"title": "mine", "due_date": due(1)}).json()
    fid = item["follow_up_id"]
    assert client.get(f"{API}/advisor/follow-ups?scope=all", headers=other).json() == []
    assert client.put(f"{API}/advisor/follow-ups/{fid}", headers=other, json={"status": "done"}).status_code == 404
    assert client.delete(f"{API}/advisor/follow-ups/{fid}", headers=other).status_code == 404
    client.delete(f"{API}/advisor/follow-ups/{fid}", headers=h)


def test_follow_ups_cannot_point_at_someone_elses_customer_or_booking(client):
    mine, theirs = two()
    h, _ = advisor(client, mine)
    foreign = assignments.customers_for(theirs)[0].profile_id
    r = client.post(f"{API}/advisor/follow-ups", headers=h, json={"title": "x", "due_date": due(1), "profile_id": foreign})
    assert r.status_code == 422
    r = client.post(f"{API}/advisor/follow-ups", headers=h, json={"title": "x", "due_date": due(1), "booking_id": "nope"})
    assert r.status_code == 422


@pytest.mark.parametrize(
    "bad", [{"title": ""}, {"title": "x" * 121}, {"due_date": "tomorrow"}, {"priority": "urgent"}, {"note": "x" * 1001}]
)
def test_follow_up_input_is_validated(client, bad):
    h, _ = advisor(client)
    assert client.post(f"{API}/advisor/follow-ups", headers=h, json={"title": "ok", "due_date": due(1), **bad}).status_code == 422


def test_follow_ups_feed_the_dashboard_and_the_customer_timeline(client):
    mine, _ = two()
    h, aid = advisor(client, mine)
    customer = assignments.customers_for(aid)[0]
    item = client.post(
        f"{API}/advisor/follow-ups", headers=h, json={"title": "Call back", "due_date": due(1), "profile_id": customer.profile_id}
    ).json()
    kpis = {k["key"]: k["value"] for k in client.get(f"{API}/advisor/dashboard", headers=h).json()["kpis"]}
    assert kpis["follow_ups"] == 1
    timeline = client.get(f"{API}/advisor/customers/{customer.profile_id}", headers=h).json()["timeline"]
    assert any(e["kind"] == "follow_up" and "Call back" in e["title"] for e in timeline)
    only_theirs = client.get(f"{API}/advisor/follow-ups?customer_id={customer.profile_id}", headers=h).json()
    assert [f["follow_up_id"] for f in only_theirs] == [item["follow_up_id"]]
    client.delete(f"{API}/advisor/follow-ups/{item['follow_up_id']}", headers=h)


def test_follow_up_routes_refuse_customers_and_guests(client, auth_headers):
    assert client.get(f"{API}/advisor/follow-ups").status_code == 401
    assert client.get(f"{API}/advisor/follow-ups", headers=auth_headers).status_code == 403


# ---- advisor profile and settings ----


def test_bio_is_saved_and_shown_to_customers(client):
    mine, _ = two()
    h, aid = advisor(client, mine)
    assert (
        client.put(f"{API}/advisor/profile", headers=h, json={"bio": "  Helping families plan.  "}).json()["bio"]
        == "Helping families plan."
    )
    listed = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == aid)
    assert listed["bio"] == "Helping families plan."
    assert client.put(f"{API}/advisor/profile", headers=h, json={"bio": "x" * 501}).status_code == 422
    assert "email" not in client.get(f"{API}/advisor/profile", headers=h).json()


def test_turning_off_a_consultation_type_removes_it_for_customers(client, auth_headers):
    pack = get_pack()
    aid = next(a for a in sorted(pack.advisors) if len(pack.advisors[a].consultation_modes) >= 2)
    h, _ = advisor(client, aid)
    modes = pack.advisors[aid].consultation_modes
    keep, drop = modes[0], modes[1]
    saved = client.put(f"{API}/advisor/settings", headers=h, json={"follow_up_default_days": 5, "consultation_modes": [keep]}).json()
    assert saved["consultation_modes"] == [keep] and saved["follow_up_default_days"] == 5 and set(saved["available_modes"]) == set(modes)
    listed = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == aid)
    assert listed["consultation_modes"] == [keep]
    assert aid not in {a["advisor_id"] for a in client.get(f"{API}/advisory/availability", params={"mode": drop}).json()["advisors"]}
    slot = listed["slots"][0]["slot_id"]
    refused = client.post(
        f"{API}/advisory/bookings",
        headers=auth_headers,
        json={"advisor_id": aid, "slot_id": slot, "user_name": "Asha Verma", "user_phone": "9876543210", "consultation_mode": drop},
    )
    assert refused.status_code == 409
    client.put(f"{API}/advisor/settings", headers=h, json={"follow_up_default_days": 3, "consultation_modes": modes})


def test_settings_reject_types_the_advisor_is_not_approved_for(client):
    pack = get_pack()
    aid = next(a for a in sorted(pack.advisors) if len(pack.advisors[a].consultation_modes) < 3)
    h, _ = advisor(client, aid)
    missing = next(m for m in ("video", "phone", "chat") if m not in pack.advisors[aid].consultation_modes)
    assert (
        client.put(f"{API}/advisor/settings", headers=h, json={"follow_up_default_days": 3, "consultation_modes": [missing]}).status_code
        == 422
    )
    for bad in ({"follow_up_default_days": 99, "consultation_modes": ["chat"]}, {"follow_up_default_days": 3, "consultation_modes": []}):
        assert client.put(f"{API}/advisor/settings", headers=h, json=bad).status_code == 422


def test_demo_advisors_have_no_password_to_change(client):
    h, _ = advisor(client)
    assert client.get(f"{API}/advisor/settings", headers=h).json()["password_change_supported"] is False
    r = client.post(f"{API}/advisor/settings/password", headers=h, json={"current_password": "x", "new_password": "longenough1"})
    assert r.status_code == 400


def test_a_provisioned_advisor_can_change_their_password(client):
    aid = sorted(get_pack().advisors)[2]
    email = get_pack().advisors[aid].email
    auth.provision_advisor(aid, "first-password-123")
    login = client.post(f"{API}/auth/login", json={"email": email, "password": "first-password-123"}).json()
    h = {"Authorization": f"Bearer {login['token']}"}
    assert client.get(f"{API}/advisor/settings", headers=h).json()["password_change_supported"] is True
    wrong = client.post(
        f"{API}/advisor/settings/password", headers=h, json={"current_password": "nope-nope-nope", "new_password": "second-password-1"}
    )
    assert wrong.status_code == 400
    same = client.post(
        f"{API}/advisor/settings/password", headers=h, json={"current_password": "first-password-123", "new_password": "first-password-123"}
    )
    assert same.status_code == 400
    ok = client.post(
        f"{API}/advisor/settings/password", headers=h, json={"current_password": "first-password-123", "new_password": "second-password-1"}
    )
    assert ok.status_code == 204
    assert client.post(f"{API}/auth/login", json={"email": email, "password": "first-password-123"}).status_code == 400
    assert client.post(f"{API}/auth/login", json={"email": email, "password": "second-password-1"}).status_code == 200


def test_advisor_settings_routes_refuse_customers(client, auth_headers):
    for method, path in (("get", "/advisor/profile"), ("get", "/advisor/settings"), ("put", "/advisor/profile")):
        assert getattr(client, method)(f"{API}{path}", headers=auth_headers).status_code in (403, 422)


# ---- the customer's own profile and settings ----


def customer_session(profile_id):
    pack = get_pack()
    p = pack.profiles[profile_id]
    token = security.issue_token(f"{profile_id.lower()}@{auth.INTERNAL_DOMAIN}", p.full_name)
    return {"Authorization": f"Bearer {token}"}


def test_customer_sees_their_own_profile_and_advisor(client):
    pid = next(iter(get_pack().profiles))
    me = client.get(f"{API}/me/profile", headers=customer_session(pid)).json()
    p = get_pack().profiles[pid]
    assert me["login_id"] == pid and me["email"] is None and me["name"] == p.full_name
    assert me["profile"]["age"] == p.age and me["profile"]["annual_income_inr"] == p.annual_income_inr
    assert me["advisor"]["advisor_id"] == assignments.advisor_for(pid)
    raw = json.dumps(me)
    assert "health_conditions" not in raw and "bmi" not in raw and "users.lifesure.app" not in raw


def test_self_registered_customer_has_no_pack_profile(client):
    token = client.post(
        f"{API}/auth/register", json={"full_name": "New Person", "email": "new.person@example.com", "password": "longenough123"}
    ).json()["token"]
    me = client.get(f"{API}/me/profile", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["profile"] is None and me["advisor"] is None and me["email"] == "new.person@example.com" and me["login_id"] is None


def test_preferences_roundtrip_and_validation(client):
    h = customer_session(next(iter(get_pack().profiles)))
    prefs = {"phone": "9876543210", "language": "Hindi", "preferred_mode": "phone", "share_summary_default": True}
    assert client.put(f"{API}/me/preferences", headers=h, json=prefs).json() == prefs
    assert client.get(f"{API}/me/profile", headers=h).json()["preferences"] == prefs
    for bad in ({"phone": "12345"}, {"phone": "98765abcde"}, {"preferred_mode": "carrier-pigeon"}, {"language": "x" * 31}):
        assert client.put(f"{API}/me/preferences", headers=h, json={**prefs, **bad}).status_code == 422


def test_preferences_do_not_disturb_the_saved_plan(client):
    h = customer_session(next(iter(get_pack().profiles)))
    client.put(f"{API}/my-plan", headers=h, json={"assessment": {"n": 1}})
    client.put(f"{API}/me/preferences", headers=h, json={"language": "Tamil"})
    assert client.get(f"{API}/my-plan", headers=h).json()["assessment"] == {"n": 1}


def test_a_customer_can_change_their_own_password(client):
    email = "pw.change@example.com"
    token = client.post(f"{API}/auth/register", json={"full_name": "Pw Change", "email": email, "password": "original-pass-1"}).json()[
        "token"
    ]
    h = {"Authorization": f"Bearer {token}"}
    assert client.get(f"{API}/me/profile", headers=h).json()["password_change_supported"] is True
    assert (
        client.post(
            f"{API}/me/password", headers=h, json={"current_password": "wrong-pass-123", "new_password": "newer-pass-123"}
        ).status_code
        == 400
    )
    assert (
        client.post(f"{API}/me/password", headers=h, json={"current_password": "original-pass-1", "new_password": "short"}).status_code
        == 422
    )
    assert (
        client.post(
            f"{API}/me/password", headers=h, json={"current_password": "original-pass-1", "new_password": "newer-pass-123"}
        ).status_code
        == 204
    )
    assert client.post(f"{API}/auth/login", json={"email": email, "password": "newer-pass-123"}).status_code == 200


def test_me_routes_need_a_session(client):
    assert client.get(f"{API}/me/profile").status_code == 401
    assert client.put(f"{API}/me/preferences", json={}).status_code == 401
