"""Admin operations on the configuration. Every change goes through ConfigStore.commit, so it is validated, saved and versioned."""

import json
import time
from typing import Any, Dict, List, Optional

from pydantic import ValidationError

from app.admin.config_store import (
    ConfigInvalidError,
    apply_patch,
    config_store,
    factory_config,
    reference,
    update_product,
)
from app.admin.schemas import (
    AdminConfig,
    ChangeResult,
    ConfigPatch,
    ConfigView,
    ProductConfig,
    ProductPatch,
    ProductView,
)
from app.core.security import AdminUser
from app.pack.loader import get_base_pack
from app.services import audit
from app.services.storage import storage_service


class ProductNotFoundError(Exception):
    pass


class ProductInUseError(Exception):
    """The product cannot be deleted: customers have it in a saved plan."""


def _errors(exc: ValidationError) -> str:
    return "; ".join(
        f"{'.'.join(str(p) for p in e['loc'])}: {e['msg'].removeprefix('Value error, ')}" if e["loc"] else e["msg"] for e in exc.errors()
    )


def view() -> ConfigView:
    active = config_store.current()
    cfg, base = active.config, get_base_pack()
    ref = reference(base)
    products = [
        ProductView(**p.model_dump(), rate_matrix_entry_ages=list(ref.ages[p.product_id]) if p.product_id in ref.ages else None)
        for p in cfg.products
    ]
    return ConfigView(
        version=cfg.version,
        updated_at=cfg.updated_at,
        updated_by=cfg.updated_by,
        needs=cfg.needs,
        underwriting=cfg.underwriting,
        products=products,
        available_riders=[{"rider_id": r.rider_id, "rider_name": r.rider_name, "category": r.rider_category} for r in base.riders.values()],
        categories=["Term Life", "Whole Life", "Endowment", "ULIP"],
    )


def _result(commit: Dict[str, Any], actor: AdminUser, action: str) -> ChangeResult:
    audit.record(actor.email, action, target=f"v{commit['version']}")
    return ChangeResult(**commit, config=view())


def _commit(builder, actor: AdminUser, summary: str, action: str, expected_version: Optional[int] = None) -> ChangeResult:
    try:
        commit = config_store.commit(builder, actor=actor.email, summary=summary, expected_version=expected_version)
    except ValidationError as exc:
        raise ConfigInvalidError(_errors(exc)) from exc
    return _result(commit, actor, action)


def update_config(patch: ConfigPatch, actor: AdminUser) -> ChangeResult:
    return _commit(
        lambda cfg: apply_patch(cfg, patch), actor, patch.note or "Configuration updated", "config.update", patch.expected_version
    )


def create_product(product: ProductConfig, actor: AdminUser) -> ChangeResult:
    if product.category == "ULIP":
        raise ConfigInvalidError(
            "ULIPs need fund and charge tables, so they cannot be created here. Edit or deactivate the existing ULIPs."
        )
    new = product.model_copy(update={"custom": True, "reference_rate_per_1000": None})

    def build(cfg: AdminConfig) -> Dict[str, Any]:
        data = cfg.model_dump()
        data["products"].append(new.model_dump())
        return data

    return _commit(build, actor, f"Added product {new.product_id}", "product.create")


def update_product_rules(product_id: str, patch: ProductPatch, actor: AdminUser, expected_version: Optional[int] = None) -> ChangeResult:
    if product_id not in {p.product_id for p in config_store.current().config.products}:
        raise ProductNotFoundError(product_id)

    def build(cfg: AdminConfig) -> Dict[str, Any]:
        data = cfg.model_dump()
        target = next(p for p in data["products"] if p["product_id"] == product_id)
        update_product(target, patch.model_dump(exclude_none=True))
        return data

    return _commit(build, actor, f"Edited product {product_id}", "product.update", expected_version)


def delete_product(product_id: str, actor: AdminUser) -> ChangeResult:
    product = next((p for p in config_store.current().config.products if p.product_id == product_id), None)
    if product is None:
        raise ProductNotFoundError(product_id)
    if not product.custom:
        raise ConfigInvalidError("Catalogue products cannot be deleted. Switch them off instead.")
    used = sum(1 for plan in storage_service.list_my_plans() if product_id in json.dumps(plan.get("plan") or {}))
    if used:
        raise ProductInUseError(f"{used} customer plan{'s' if used != 1 else ''} include this product. Deactivate it instead.")

    def build(cfg: AdminConfig) -> Dict[str, Any]:
        data = cfg.model_dump()
        data["products"] = [p for p in data["products"] if p["product_id"] != product_id]
        return data

    return _commit(build, actor, f"Deleted product {product_id}", "product.delete")


def reset(actor: AdminUser) -> ChangeResult:
    """Back to the canonical baseline: the catalogue's own products and assumptions. Admin-created products are removed."""
    base = get_base_pack()
    return _commit(lambda cfg: factory_config(base).model_dump(), actor, "Reset to factory defaults", "config.reset")


def rollback(version: int, actor: AdminUser, expected_version: Optional[int] = None) -> ChangeResult:
    snapshot = config_store.snapshot_of(version)
    if snapshot is None:
        raise ConfigInvalidError(f"Version {version} is not in the saved history.")
    return _commit(lambda cfg: dict(snapshot), actor, f"Rolled back to version {version}", "config.rollback", expected_version)


def reload(actor: AdminUser) -> Dict[str, Any]:
    started = time.perf_counter()
    active = config_store.reload()
    audit.record(actor.email, "config.reload", target=f"v{active.config.version}")
    return {
        "version": active.config.version,
        "updated_at": active.config.updated_at,
        "reload_ms": round((time.perf_counter() - started) * 1000, 3),
    }


def history() -> List[Dict[str, Any]]:
    return config_store.history()
