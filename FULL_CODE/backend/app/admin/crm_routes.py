"""CRM API. Administrators only, checked on the server."""

from typing import Any, Dict, List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.admin import analytics, crm
from app.admin.crm_schemas import Lead, LeadUpdate, NewLead, NoteIn, Pipeline
from app.core.security import AdminUser, current_admin, rate_limit
from app.services import audit

router = APIRouter(prefix="/admin/crm", tags=["admin crm"])
_writes = Depends(rate_limit("crm-write", limit=120))


def _guard(call, *args):
    try:
        return call(*args)
    except crm.LeadNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Lead not found") from exc
    except crm.LeadConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except crm.LeadInvalidError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/pipeline", response_model=Pipeline)
def pipeline(
    q: str = Query("", max_length=80),
    owner: str = Query("", max_length=32),
    source: Literal["", "assessment", "booking", "manual"] = "",
    admin: AdminUser = Depends(current_admin),
) -> Pipeline:
    return crm.pipeline(q, owner, source)


@router.post("/sync", dependencies=[_writes])
def sync_now(admin: AdminUser = Depends(current_admin)) -> Dict[str, str]:
    return {"synced_at": crm.sync(force=True)}


@router.post("/leads", response_model=Lead, status_code=201, dependencies=[_writes])
def create_lead(req: NewLead, admin: AdminUser = Depends(current_admin)) -> Lead:
    return _guard(crm.create, req, admin)


@router.get("/leads/{lead_id}", response_model=Lead)
def get_lead(lead_id: str, admin: AdminUser = Depends(current_admin)) -> Lead:
    return _guard(crm.get, lead_id)


@router.put("/leads/{lead_id}", response_model=Lead, dependencies=[_writes])
def update_lead(lead_id: str, req: LeadUpdate, admin: AdminUser = Depends(current_admin)) -> Lead:
    return _guard(crm.update, lead_id, req, admin)


@router.post("/leads/{lead_id}/notes", response_model=Lead, dependencies=[_writes])
def add_note(lead_id: str, req: NoteIn, admin: AdminUser = Depends(current_admin)) -> Lead:
    return _guard(crm.add_note, lead_id, req.text, admin)


@router.get("/reports")
def reports(admin: AdminUser = Depends(current_admin)) -> Dict[str, Any]:
    return crm.reports()


@router.get("/export")
def export(
    format: Literal["csv", "json"] = "csv",
    stage: Literal["", "new", "contacted", "qualified", "proposal", "won", "lost"] = "",
    admin: AdminUser = Depends(current_admin),
) -> Response:
    rows: List[Dict[str, Any]] = crm.export_rows(stage)
    audit.record(admin.email, "crm.export", target=format)
    name = f"lifesure-crm-{stage or 'all'}.{format}"
    headers = {"Content-Disposition": f'attachment; filename="{name}"'}
    if format == "json":
        return Response(analytics.export_json(rows), media_type="application/json", headers=headers)
    return Response(crm.export_csv(rows), media_type="text/csv", headers=headers)
