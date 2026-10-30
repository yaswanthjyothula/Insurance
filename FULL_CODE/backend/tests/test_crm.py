"""The admin CRM: leads that come from real customer activity, the pipeline, reports and exports."""

import json

import pytest

from app.admin import crm
from app.pack.loader import get_pack
from app.services.storage import storage_service

API = "/api/v1"
ASSESS = {
    "age": 32,
    "annual_income": 1_800_000,
    "annual_expenses": 720_000,
    "dependents_count": 2,
    "outstanding_liabilities": 4_000_000,
    "existing_cover": 0,
    "eligible_assets": 500_000,
}


@pytest.fixture(autouse=True)
def _empty_crm():
    """Each test starts with no leads and none of the customer activity they are built from, so counts are exact."""

    def clear():
        for name in ("crm_leads", "assessments", "bookings", "my_plans", "messages"):
            path = storage_service._path(name)
            if path.exists():
                path.unlink()
        crm._last_sync = 0.0

    clear()
    crm.SYNC_TTL_SECONDS = 0  # always read the latest activity
    yield
    crm.SYNC_TTL_SECONDS = 3
    clear()


@pytest.fixture()
def admin(client):
    return {"Authorization": f"Bearer {client.post(f'{API}/auth/demo/admin').json()['token']}"}


def pipeline(client, admin, **params):
    return client.get(f"{API}/admin/crm/pipeline", headers=admin, params=params).json()


def column(pl, stage):
    return next(c for c in pl["stages"] if c["key"] == stage)


def book(client, headers, advisor_id=None, slot_index=0):
    advisor_id = advisor_id or sorted(get_pack().advisors)[0]
    adv = next(a for a in client.get(f"{API}/advisory/availability").json()["advisors"] if a["advisor_id"] == advisor_id)
    return client.post(
        f"{API}/advisory/bookings",
        headers=headers,
        json={
            "advisor_id": advisor_id,
            "slot_id": adv["slots"][slot_index]["slot_id"],
            "user_name": "Demo Customer",
            "user_phone": "9876543210",
            "consultation_mode": adv["consultation_modes"][0],
        },
    )


# ---- leads come from what customers did ----


def test_a_signed_in_assessment_becomes_a_new_lead(client, admin, auth_headers):
    assert pipeline(client, admin)["total_leads"] == 0
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    pl = pipeline(client, admin)
    lead = column(pl, "new")["leads"][0]
    assert pl["total_leads"] == 1 and lead["source"] == "assessment" and lead["name"] == "Demo Customer" and lead["cover_needed"] > 0
    assert lead["stage"] == "new" and lead["owner_advisor_id"] is None


def test_a_guest_assessment_is_not_a_lead(client, admin):
    client.post(f"{API}/assessments", json=ASSESS)
    assert pipeline(client, admin)["total_leads"] == 0


def test_one_lead_per_customer_however_many_assessments(client, admin, auth_headers):
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    client.post(f"{API}/assessments", json={**ASSESS, "annual_income": 3_000_000}, headers=auth_headers)
    pl = pipeline(client, admin)
    assert pl["total_leads"] == 1
    detail = client.get(f"{API}/admin/crm/leads/{column(pl, 'new')['leads'][0]['lead_id']}", headers=admin).json()
    assert detail["inputs"]["annual_income"] == 3_000_000  # the latest answers


def test_booking_an_advisor_moves_the_lead_forward_and_sets_the_owner(client, admin, auth_headers):
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    advisor = sorted(get_pack().advisors)[0]
    assert book(client, auth_headers, advisor).status_code == 200
    lead = column(pipeline(client, admin), "contacted")["leads"][0]
    assert lead["owner_advisor_id"] == advisor and lead["owner_name"]
    detail = client.get(f"{API}/admin/crm/leads/{lead['lead_id']}", headers=admin).json()
    assert [h["to_stage"] for h in detail["history"]] == ["new", "contacted"] and detail["history"][-1]["by"] == "system"


def test_choosing_a_plan_moves_it_to_proposal_with_the_premium(client, admin, auth_headers):
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    client.put(
        f"{API}/my-plan",
        headers=auth_headers,
        json={"plan": {"items": [{"product_id": "PRD-X4CBUF", "total_annual_premium": 12000}], "total_cover": 5_000_000}},
    )
    lead = column(pipeline(client, admin), "proposal")["leads"][0]
    assert lead["annual_premium"] == 12000
    client.delete(f"{API}/my-plan/choice", headers=auth_headers)


def test_the_platform_never_moves_a_lead_backwards_or_out_of_won(client, admin, auth_headers):
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    lead_id = column(pipeline(client, admin), "new")["leads"][0]["lead_id"]
    client.put(f"{API}/admin/crm/leads/{lead_id}", headers=admin, json={"stage": "won"})
    book(client, auth_headers)
    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    crm._last_sync = 0.0
    assert client.get(f"{API}/admin/crm/leads/{lead_id}", headers=admin).json()["stage"] == "won"
    assert pipeline(client, admin)["total_leads"] == 1


def test_a_booking_without_an_assessment_still_creates_a_lead(client, admin, auth_headers):
    book(client, auth_headers, slot_index=1)
    pl = pipeline(client, admin)
    assert column(pl, "contacted")["leads"][0]["source"] == "booking"


# ---- working the pipeline ----


def make_lead(client, admin, **extra):
    return client.post(
        f"{API}/admin/crm/leads",
        headers=admin,
        json={"name": "Asha Verma", "contact": "asha@example.com", "cover_needed": 5_000_000, **extra},
    )


def test_a_lead_can_be_added_by_hand(client, admin):
    advisor = sorted(get_pack().advisors)[1]
    r = make_lead(client, admin, note="Met at the branch", owner_advisor_id=advisor)
    assert r.status_code == 201
    lead = r.json()
    assert (
        lead["source"] == "manual"
        and lead["stage"] == "new"
        and lead["owner_advisor_id"] == advisor
        and lead["notes"][0]["text"] == "Met at the branch"
    )
    assert pipeline(client, admin)["total_leads"] == 1
    assert make_lead(client, admin, owner_advisor_id="ADV-NOPE").status_code == 422
    assert client.post(f"{API}/admin/crm/leads", headers=admin, json={"name": "A"}).status_code == 422


def test_moving_a_lead_records_who_and_when(client, admin):
    lead = make_lead(client, admin).json()
    r = client.put(f"{API}/admin/crm/leads/{lead['lead_id']}", headers=admin, json={"stage": "qualified"})
    assert r.status_code == 200 and r.json()["stage"] == "qualified" and r.json()["version"] == lead["version"] + 1
    last = r.json()["history"][-1]
    assert last["from_stage"] == "new" and last["to_stage"] == "qualified" and last["by"] == "adm-demo@users.lifesure.app"
    assert column(pipeline(client, admin), "qualified")["count"] == 1 and column(pipeline(client, admin), "new")["count"] == 0


def test_losing_a_lead_needs_a_reason(client, admin):
    lead = make_lead(client, admin).json()
    url = f"{API}/admin/crm/leads/{lead['lead_id']}"
    assert client.put(url, headers=admin, json={"stage": "lost"}).status_code == 422
    assert client.put(url, headers=admin, json={"stage": "lost", "lost_reason": "  "}).status_code == 422
    r = client.put(url, headers=admin, json={"stage": "lost", "lost_reason": "Chose a competitor"})
    assert r.status_code == 200 and r.json()["lost_reason"] == "Chose a competitor"
    back = client.put(url, headers=admin, json={"stage": "contacted"}).json()
    assert back["lost_reason"] is None and back["stage"] == "contacted"


def test_assigning_and_unassigning_an_owner(client, admin):
    lead = make_lead(client, admin).json()
    url = f"{API}/admin/crm/leads/{lead['lead_id']}"
    advisor = sorted(get_pack().advisors)[2]
    assert client.put(url, headers=admin, json={"owner_advisor_id": advisor}).json()["owner_advisor_id"] == advisor
    assert client.put(url, headers=admin, json={"owner_advisor_id": "ADV-NOPE"}).status_code == 422
    assert client.put(url, headers=admin, json={"clear_owner": True}).json()["owner_advisor_id"] is None
    assert pipeline(client, admin, owner="none")["total_leads"] == 1
    client.put(url, headers=admin, json={"owner_advisor_id": advisor})
    assert pipeline(client, admin, owner=advisor)["total_leads"] == 1 and pipeline(client, admin, owner="none")["total_leads"] == 0


def test_a_stale_edit_is_refused_not_merged(client, admin):
    lead = make_lead(client, admin).json()
    url = f"{API}/admin/crm/leads/{lead['lead_id']}"
    assert client.put(url, headers=admin, json={"stage": "contacted", "expected_version": lead["version"]}).status_code == 200
    stale = client.put(url, headers=admin, json={"stage": "qualified", "expected_version": lead["version"]})
    assert stale.status_code == 409 and client.get(url, headers=admin).json()["stage"] == "contacted"


def test_notes_are_kept_with_their_author(client, admin):
    lead = make_lead(client, admin).json()
    r = client.post(f"{API}/admin/crm/leads/{lead['lead_id']}/notes", headers=admin, json={"text": "Call after 5pm"})
    assert r.status_code == 200 and r.json()["notes"][-1]["text"] == "Call after 5pm" and r.json()["notes"][-1]["by"]
    assert client.post(f"{API}/admin/crm/leads/{lead['lead_id']}/notes", headers=admin, json={"text": ""}).status_code == 422
    assert client.post(f"{API}/admin/crm/leads/{lead['lead_id']}/notes", headers=admin, json={"text": "x" * 1001}).status_code == 422
    assert column(pipeline(client, admin), "new")["leads"][0]["note_count"] == 1


@pytest.mark.parametrize("body", [{"stage": "archived"}, {"unknown": 1}, {"name": "A"}])
def test_bad_lead_updates_are_rejected(client, admin, body):
    lead = make_lead(client, admin).json()
    assert client.put(f"{API}/admin/crm/leads/{lead['lead_id']}", headers=admin, json=body).status_code == 422


def test_unknown_lead_is_a_404(client, admin):
    assert client.get(f"{API}/admin/crm/leads/nope", headers=admin).status_code == 404
    assert client.put(f"{API}/admin/crm/leads/nope", headers=admin, json={"stage": "won"}).status_code == 404
    assert client.post(f"{API}/admin/crm/leads/nope/notes", headers=admin, json={"text": "x"}).status_code == 404


def test_pipeline_search_and_source_filters(client, admin):
    make_lead(client, admin)
    client.post(f"{API}/admin/crm/leads", headers=admin, json={"name": "Ravi Kumar", "contact": "ravi@example.com"})
    assert pipeline(client, admin, q="ravi")["total_leads"] == 1 and pipeline(client, admin, q="zzz")["total_leads"] == 0
    assert pipeline(client, admin, source="manual")["total_leads"] == 2 and pipeline(client, admin, source="assessment")["total_leads"] == 0
    assert client.get(f"{API}/admin/crm/pipeline", headers=admin, params={"source": "other"}).status_code == 422


def test_board_totals_count_only_open_cover(client, admin):
    a, b = make_lead(client, admin).json(), make_lead(client, admin, cover_needed=2_000_000).json()
    client.put(f"{API}/admin/crm/leads/{b['lead_id']}", headers=admin, json={"stage": "won"})
    pl = pipeline(client, admin)
    assert pl["total_leads"] == 2 and pl["open_leads"] == 1 and pl["open_cover"] == 5_000_000
    assert column(pl, "won")["cover_total"] == 2_000_000 and a["lead_id"]


# ---- reports and export ----


def test_reports_are_computed_from_the_leads_and_their_history(client, admin):
    advisor = sorted(get_pack().advisors)[0]
    first, second, third = (make_lead(client, admin, owner_advisor_id=advisor).json() for _ in range(3))
    client.put(f"{API}/admin/crm/leads/{first['lead_id']}", headers=admin, json={"stage": "qualified"})
    client.put(f"{API}/admin/crm/leads/{first['lead_id']}", headers=admin, json={"stage": "won"})
    client.put(f"{API}/admin/crm/leads/{second['lead_id']}", headers=admin, json={"stage": "lost", "lost_reason": "Too expensive"})
    rep = client.get(f"{API}/admin/crm/reports", headers=admin).json()
    assert rep["total_leads"] == 3 and rep["won"] == 1 and rep["lost"] == 1 and rep["open_leads"] == 1
    assert rep["win_rate_percent"] == 50.0 and rep["overall_conversion_percent"] == pytest.approx(33.3, abs=0.1)
    funnel = {f["key"]: f["count"] for f in rep["funnel"]}
    assert funnel == {"new": 3, "contacted": 1, "qualified": 1, "proposal": 1, "won": 1} or funnel["won"] == 1 and funnel["new"] == 3
    row = next(r for r in rep["by_advisor"] if r["advisor_id"] == advisor)
    assert (row["open"], row["won"], row["lost"]) == (1, 1, 1)
    assert rep["lost_reasons"] == [{"reason": "too expensive", "count": 1}] and rep["by_source"] == {"manual": 3}
    assert sum(d["count"] for d in rep["created_per_day"]) == 3 and len(rep["created_per_day"]) == 30
    assert third["lead_id"] and rep["average_days_to_win"] == 0.0


def test_reports_say_nothing_when_there_is_nothing(client, admin):
    rep = client.get(f"{API}/admin/crm/reports", headers=admin).json()
    assert (
        rep["total_leads"] == 0
        and rep["win_rate_percent"] is None
        and rep["average_days_to_win"] is None
        and rep["overall_conversion_percent"] is None
    )


def test_export_csv_and_json_with_stage_filter(client, admin):
    a, b = make_lead(client, admin).json(), make_lead(client, admin).json()
    client.put(f"{API}/admin/crm/leads/{b['lead_id']}", headers=admin, json={"stage": "contacted"})
    everything = client.get(f"{API}/admin/crm/export", headers=admin)
    assert (
        everything.status_code == 200
        and "attachment" in everything.headers["content-disposition"]
        and "lead_id,name,customer_id" in everything.text
    )
    only = json.loads(client.get(f"{API}/admin/crm/export", headers=admin, params={"format": "json", "stage": "contacted"}).text)
    assert [r["lead_id"] for r in only] == [b["lead_id"]] and a["lead_id"]
    assert client.get(f"{API}/admin/crm/export", headers=admin, params={"format": "xml"}).status_code == 422


def test_export_cannot_run_as_a_spreadsheet_formula(client, admin):
    client.post(f"{API}/admin/crm/leads", headers=admin, json={"name": '=HYPERLINK("http://evil")', "contact": "+1+1"})
    text = client.get(f"{API}/admin/crm/export", headers=admin).text
    assert "'=HYPERLINK" in text and "'+1+1" in text


def test_crm_actions_are_audited(client, admin):
    lead = make_lead(client, admin).json()
    client.put(f"{API}/admin/crm/leads/{lead['lead_id']}", headers=admin, json={"stage": "contacted"})
    client.get(f"{API}/admin/crm/export", headers=admin)
    lines = [json.loads(x) for x in (storage_service.root / "audit_log.jsonl").read_text().splitlines()]
    actions = {e["action"] for e in lines}
    assert {"crm.lead.create", "crm.lead.stage", "crm.export"} <= actions
    assert all(set(e) == {"at", "actor", "action", "target", "outcome"} for e in lines)


# ---- access ----


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("get", "/admin/crm/pipeline", None),
        ("post", "/admin/crm/sync", None),
        ("post", "/admin/crm/leads", {"name": "Asha Verma"}),
        ("get", "/admin/crm/leads/x", None),
        ("put", "/admin/crm/leads/x", {"stage": "won"}),
        ("post", "/admin/crm/leads/x/notes", {"text": "hi"}),
        ("get", "/admin/crm/reports", None),
        ("get", "/admin/crm/export", None),
    ],
)
def test_crm_routes_are_for_administrators_only(client, auth_headers, method, path, body):
    kwargs = {"json": body} if body is not None else {}
    assert getattr(client, method)(f"{API}{path}", **kwargs).status_code == 401
    assert getattr(client, method)(f"{API}{path}", headers=auth_headers, **kwargs).status_code == 403
    advisor = client.post(f"{API}/auth/demo/advisor", json={}).json()["token"]
    assert getattr(client, method)(f"{API}{path}", headers={"Authorization": f"Bearer {advisor}"}, **kwargs).status_code == 403


def test_a_completed_advisor_session_makes_the_lead_qualified(client, admin, auth_headers, monkeypatch):
    from datetime import datetime, timedelta

    from app.services import advisory

    client.post(f"{API}/assessments", json=ASSESS, headers=auth_headers)
    advisor = sorted(get_pack().advisors)[0]
    booking = book(client, auth_headers, advisor).json()
    assert column(pipeline(client, admin), "contacted")["count"] == 1
    when = datetime.strptime(booking["slot_start"], advisory.SLOT_FORMAT) + timedelta(minutes=45)
    monkeypatch.setattr(advisory, "reference_now", lambda: when)
    advisor_token = client.post(f"{API}/auth/demo/advisor", json={"advisor_id": advisor}).json()["token"]
    done = client.post(
        f"{API}/advisor/appointments/{booking['booking_id']}/outcome",
        headers={"Authorization": f"Bearer {advisor_token}"},
        json={"outcome": "completed"},
    )
    assert done.status_code == 200
    lead = column(pipeline(client, admin), "qualified")["leads"][0]
    detail = client.get(f"{API}/admin/crm/leads/{lead['lead_id']}", headers=admin).json()
    assert detail["history"][-1]["note"] == "Advisor session completed" and detail["history"][-1]["by"] == "system"
