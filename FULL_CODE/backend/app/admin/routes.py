"""Admin console API. Every route needs an administrator session, checked here on the server."""

from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.admin import analytics, service
from app.admin.config_store import ConfigConflictError, ConfigInvalidError, ConfigPersistenceError
from app.admin.schemas import ChangeResult, ConfigPatch, ConfigView, HistoryEntry, ProductConfig, ProductPatch, RollbackRequest
from app.core.security import AdminUser, current_admin, rate_limit
from app.services import audit
from app.services.quick_quote import QuickQuoteIn, quick_quote

router = APIRouter(prefix="/admin", tags=["admin"])
_writes = Depends(rate_limit("admin-write", limit=60))


def _guard(call, *args):
    """Runs an admin action, turning the configuration errors into clear HTTP answers."""
    try:
        return call(*args)
    except ConfigInvalidError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ConfigConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except service.ProductNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc
    except service.ProductInUseError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ConfigPersistenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/config", response_model=ConfigView)
def get_config(admin: AdminUser = Depends(current_admin)) -> ConfigView:
    return service.view()


@router.put("/config", response_model=ChangeResult, dependencies=[_writes])
def put_config(patch: ConfigPatch, admin: AdminUser = Depends(current_admin)) -> ChangeResult:
    return _guard(service.update_config, patch, admin)


@router.post("/products", response_model=ChangeResult, status_code=201, dependencies=[_writes])
def add_product(product: ProductConfig, admin: AdminUser = Depends(current_admin)) -> ChangeResult:
    return _guard(service.create_product, product, admin)


@router.put("/products/{product_id}", response_model=ChangeResult, dependencies=[_writes])
def edit_product(
    product_id: str, patch: ProductPatch, expected_version: Optional[int] = Query(None, ge=1), admin: AdminUser = Depends(current_admin)
) -> ChangeResult:
    return _guard(service.update_product_rules, product_id, patch, admin, expected_version)


@router.delete("/products/{product_id}", response_model=ChangeResult, dependencies=[_writes])
def remove_product(product_id: str, admin: AdminUser = Depends(current_admin)) -> ChangeResult:
    return _guard(service.delete_product, product_id, admin)


@router.post("/reload", dependencies=[_writes])
def reload_config(admin: AdminUser = Depends(current_admin)) -> Dict[str, Any]:
    return _guard(service.reload, admin)


@router.post("/reset", response_model=ChangeResult, dependencies=[_writes])
def reset_config(admin: AdminUser = Depends(current_admin)) -> ChangeResult:
    return _guard(service.reset, admin)


@router.get("/config/history", response_model=List[HistoryEntry])
def config_history(admin: AdminUser = Depends(current_admin)) -> List[Dict[str, Any]]:
    return service.history()


@router.post("/config/rollback", response_model=ChangeResult, dependencies=[_writes])
def rollback(req: RollbackRequest, admin: AdminUser = Depends(current_admin)) -> ChangeResult:
    return _guard(service.rollback, req.version, admin, req.expected_version)


@router.post("/test-calculator")
def test_calculator(req: QuickQuoteIn, admin: AdminUser = Depends(current_admin)) -> Dict[str, Any]:
    return quick_quote(req)


@router.get("/analytics")
def get_analytics(admin: AdminUser = Depends(current_admin)) -> Dict[str, Any]:
    return analytics.summary()


@router.get("/leads")
def get_leads(
    q: str = Query("", max_length=80), limit: int = Query(200, ge=1, le=1000), admin: AdminUser = Depends(current_admin)
) -> List[Dict[str, Any]]:
    audit.record(admin.email, "leads.view")
    return analytics.leads(q, limit)


@router.get("/leads/export")
def export_leads(format: Literal["csv", "json"] = "csv", admin: AdminUser = Depends(current_admin)) -> Response:
    rows = analytics.leads(limit=1000)
    audit.record(admin.email, "leads.export", target=format)
    if format == "json":
        return Response(
            analytics.export_json(rows),
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="lifesure-leads.json"'},
        )
    return Response(
        analytics.export_csv(rows), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="lifesure-leads.csv"'}
    )
