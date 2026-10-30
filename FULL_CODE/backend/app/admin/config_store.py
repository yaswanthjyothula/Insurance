"""The live configuration: an immutable in-memory snapshot, swapped atomically, persisted before it is activated.

Lifecycle of an update: validate -> build the effective pack -> persist -> swap. Persistence happens before the swap, so a failed
write leaves the previous configuration active; and a configuration that fails validation never gets near either.
"""

import logging
import threading
import time
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, replace
from datetime import datetime
from decimal import Decimal
from typing import Any, Callable, Dict, Iterator, List, Optional, Tuple

from app.admin.schemas import (
    AdminConfig,
    ConfigPatch,
    GenderFactors,
    NeedsConfig,
    ProductConfig,
    UnderwritingConfig,
)
from app.core.compat import UTC
from app.pack.loader import PackData, get_base_pack
from app.pack.models import IncomeMultipleLimit, Product, SaBand

log = logging.getLogger("lifesure.admin")
HISTORY_LIMIT = 25
REFERENCE_AGE, REFERENCE_TERM = 30, 20
DEFAULT_MODAL = {"annual": 1.0, "half_yearly": 0.5088, "quarterly": 0.2594, "monthly": 0.0875}


class ConfigConflictError(Exception):
    """Another update was activated first. The message says which version is now live."""


class ConfigInvalidError(Exception):
    """The proposed configuration breaks a rule. Nothing was changed."""


class ConfigPersistenceError(Exception):
    """The configuration could not be saved, so it was not activated."""


@dataclass(frozen=True)
class RateAdjust:
    multiplier: Decimal
    smoker_loading: Decimal  # 1 + loading%/100
    male: Decimal
    female: Decimal
    custom_base: Optional[Decimal]  # set only for products created in the console, which have no rate table
    age_loading: Decimal  # per year above 30, as a fraction


@dataclass(frozen=True)
class Active:
    config: AdminConfig
    pack: PackData


@dataclass
class Reference:
    """Facts read once from the base rate table: the rate at the reference point and the ages the table prices."""

    rate: Dict[str, float]
    ages: Dict[str, Tuple[int, int]]


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _read_reference(base: PackData) -> Reference:
    best: Dict[str, Tuple[Tuple[int, int, int], float]] = {}
    ages: Dict[str, Tuple[int, int]] = {}
    for (pid, option, age, term, gender, smoker), value in base.rates.items():
        lo, hi = ages.get(pid, (age, age))
        ages[pid] = (min(lo, age), max(hi, age))
        if age == REFERENCE_AGE and gender == "male" and smoker == "non_smoker":
            key = (0 if option == "regular" else 1, abs(term - REFERENCE_TERM), term)
            if pid not in best or key < best[pid][0]:
                best[pid] = (key, float(value))
    return Reference(rate={pid: round(v, 6) for pid, (_, v) in best.items()}, ages=ages)


_reference: Optional[Reference] = None


def reference(base: PackData) -> Reference:
    global _reference
    if _reference is None:
        _reference = _read_reference(base)
    return _reference


def _tenure(p: Product) -> Tuple[int, int]:
    low = p.min_policy_term_years or 1
    high = p.max_policy_term_years or max(low, p.max_maturity_age - p.min_entry_age)
    return low, min(99, high)


def _ulip_sa_bounds(p: Product) -> Tuple[int, int]:
    multiples = [m for ms in (p.sa_multiple_of_annual_premium or {}).values() for m in ms] or [1.0]
    low = int((p.min_annual_premium_inr or 0) * min(multiples)) or 100_000
    high = int((p.max_annual_premium_inr or 0) * max(multiples)) or 100_000_000
    return max(1, low), max(low, high)


def factory_product(p: Product, ref: Reference) -> ProductConfig:
    tenure_lo, tenure_hi = _tenure(p)
    if p.is_ulip:
        sa_lo, sa_hi = _ulip_sa_bounds(p)
    else:
        sa_lo, sa_hi = p.min_sum_assured_inr or 1, p.max_sum_assured_inr or 10_000_000_000
    rate = ref.rate.get(p.product_id)
    return ProductConfig(
        product_id=p.product_id,
        product_name=p.product_name,
        category=p.product_type,  # type: ignore[arg-type]
        active=True,
        minimum_entry_age=p.min_entry_age,
        maximum_entry_age=p.max_entry_age,
        minimum_maturity_age=p.min_maturity_age or min(p.max_maturity_age, p.min_entry_age + tenure_lo),
        maximum_maturity_age=p.max_maturity_age,
        minimum_tenure=tenure_lo,
        maximum_tenure=tenure_hi,
        minimum_sum_assured=sa_lo,
        maximum_sum_assured=sa_hi,
        maximum_income_multiple=None,
        base_rate_per_1000=None if p.is_ulip else (rate if rate is not None else 1.0),
        reference_rate_per_1000=None if p.is_ulip else rate,
        smoker_loading_percentage=0.0,
        gender_discount_factors=GenderFactors(),
        allowed_riders=list(p.riders_allowed),
    )


def factory_config(base: PackData, version: int = 1, actor: str = "system") -> AdminConfig:
    """The canonical baseline: the pack's own assumptions and products, so a reset reproduces the original behaviour exactly."""
    a, ref = base.assumptions, reference(base)
    return AdminConfig(
        version=version,
        updated_at=_now(),
        updated_by=actor,
        needs=NeedsConfig(
            income_replacement_multiple_min=10,
            income_replacement_multiple_max=15,
            inflation_rate=a.general_inflation_pct_pa,
            discount_rate=a.post_tax_return_on_payout_pct_pa,
            deceased_expense_reduction_factor=a.household_expense_share_of_deceased_pct,
            emergency_fund_months=a.emergency_fund_months,
        ),
        underwriting=UnderwritingConfig(
            non_medical_sum_assured_limit=10_000_000,
            non_medical_maximum_age=35,
            tele_medical_threshold=25_000_000,
            physical_medical_threshold=50_000_000,
            stp_enabled=True,
            stp_maximum_sum_assured=5_000_000,
            stp_maximum_age=35,
            stp_allow_smokers=False,
        ),
        products=[factory_product(p, ref) for p in base.products.values()],
    )


def _overlay(base_product: Product, pc: ProductConfig) -> Product:
    limits = base_product.income_multiple_limits
    if pc.maximum_income_multiple is not None:
        limits = [
            IncomeMultipleLimit(min_age=lim.min_age, max_age=lim.max_age, max_multiple_of_annual_income=int(pc.maximum_income_multiple))
            for lim in limits
        ]
        if not limits:
            limits = [
                IncomeMultipleLimit(
                    min_age=pc.minimum_entry_age,
                    max_age=pc.maximum_entry_age,
                    max_multiple_of_annual_income=int(pc.maximum_income_multiple),
                )
            ]
    return base_product.model_copy(
        update={
            "product_name": pc.product_name,
            "active": pc.active,
            "min_entry_age": pc.minimum_entry_age,
            "max_entry_age": pc.maximum_entry_age,
            "min_maturity_age": pc.minimum_maturity_age,
            "max_maturity_age": pc.maximum_maturity_age,
            "min_policy_term_years": pc.minimum_tenure,
            "max_policy_term_years": pc.maximum_tenure,
            "min_sum_assured_inr": pc.minimum_sum_assured,
            "max_sum_assured_inr": pc.maximum_sum_assured,
            "income_multiple_limits": limits,
            "riders_allowed": list(pc.allowed_riders),
        }
    )


def _custom_product(pc: ProductConfig, base: PackData) -> Product:
    """A product created in the console. It borrows its payment modes from a pack product of the same category."""
    template = next((p for p in base.products.values() if p.product_type == pc.category), None)
    modal = {k: getattr(template, f"modal_factor_{k}", None) or v for k, v in DEFAULT_MODAL.items()} if template else DEFAULT_MODAL
    multiple = int(pc.maximum_income_multiple or 25)
    return Product(
        product_id=pc.product_id,
        product_name=pc.product_name,
        product_type=pc.category,
        variant="custom",
        participation="non_par",
        plain_language_summary=f"{pc.product_name}: a product configured by the administrator. Priced from a base rate with age loading.",
        min_entry_age=pc.minimum_entry_age,
        max_entry_age=pc.maximum_entry_age,
        max_maturity_age=pc.maximum_maturity_age,
        min_maturity_age=pc.minimum_maturity_age,
        min_sum_assured_inr=pc.minimum_sum_assured,
        max_sum_assured_inr=pc.maximum_sum_assured,
        sum_assured_step_inr=(template.sum_assured_step_inr if template else None) or 100_000,
        policy_term_rule="any whole number of years within the limits",
        allowed_policy_terms="any",
        min_policy_term_years=pc.minimum_tenure,
        max_policy_term_years=pc.maximum_tenure,
        premium_payment_options=["regular"],
        premium_modes=list(DEFAULT_MODAL),
        modal_factor_annual=modal["annual"],
        modal_factor_half_yearly=modal["half_yearly"],
        modal_factor_quarterly=modal["quarterly"],
        modal_factor_monthly=modal["monthly"],
        sa_band_factors=[SaBand(min_sa_inr=0, max_sa_inr=None, factor=1.0)],
        min_annual_income_inr=0,
        income_multiple_limits=[
            IncomeMultipleLimit(min_age=pc.minimum_entry_age, max_age=pc.maximum_entry_age, max_multiple_of_annual_income=multiple)
        ],
        max_new_non_term_sa_multiple_of_income=(template.max_new_non_term_sa_multiple_of_income if template else None),
        nri_eligible=True,
        riders_allowed=list(pc.allowed_riders),
        pricing_source="admin console",
        active=pc.active,
    )


def build_pack(cfg: AdminConfig, base: PackData) -> PackData:
    """The effective pack for one configuration. Raises ConfigInvalidError if it refers to anything that does not exist."""
    ref = reference(base)
    riders = set(base.riders)
    products: Dict[str, Product] = {}
    adjust: Dict[str, RateAdjust] = {}
    for pc in cfg.products:
        unknown = [r for r in pc.allowed_riders if r not in riders]
        if unknown:
            raise ConfigInvalidError(f"{pc.product_name}: unknown rider {', '.join(unknown)}.")
        base_product = base.products.get(pc.product_id)
        if pc.custom:
            if base_product is not None:
                raise ConfigInvalidError(f"{pc.product_id} is already a catalogue product.")
            products[pc.product_id] = _custom_product(pc, base)
            custom_base = Decimal(str(pc.base_rate_per_1000))
            multiplier = Decimal(1)
        else:
            if base_product is None:
                raise ConfigInvalidError(f"{pc.product_id} is not in the catalogue.")
            if pc.category != base_product.product_type:
                raise ConfigInvalidError(f"{pc.product_name}: the category of a catalogue product cannot change.")
            products[pc.product_id] = _overlay(base_product, pc)
            custom_base = None
            reference_rate = ref.rate.get(pc.product_id)
            multiplier = (
                Decimal(str(pc.base_rate_per_1000)) / Decimal(str(reference_rate))
                if pc.base_rate_per_1000 and reference_rate
                else Decimal(1)
            )
            if abs(multiplier - 1) < Decimal("0.0000005"):
                multiplier = Decimal(1)
        adjust[pc.product_id] = RateAdjust(
            multiplier=multiplier,
            smoker_loading=Decimal(1) + Decimal(str(pc.smoker_loading_percentage)) / 100,
            male=Decimal(str(pc.gender_discount_factors.male)),
            female=Decimal(str(pc.gender_discount_factors.female)),
            custom_base=custom_base,
            age_loading=Decimal(str(pc.age_loading_percentage_per_year)) / 100,
        )
    n = cfg.needs
    assumptions = base.assumptions.model_copy(
        update={
            "general_inflation_pct_pa": n.inflation_rate,
            "post_tax_return_on_payout_pct_pa": n.discount_rate,
            "household_expense_share_of_deceased_pct": n.deceased_expense_reduction_factor,
            "emergency_fund_months": n.emergency_fund_months,
        }
    )
    return replace(
        base,
        products=products,
        assumptions=assumptions,
        rate_adjust=adjust,
        underwriting=cfg.underwriting,
        needs=n,
        config_version=cfg.version,
    )


def _diff(old: Any, new: Any, path: str = "") -> List[str]:
    """Dotted names of everything that differs between two config dicts."""
    if isinstance(old, dict) and isinstance(new, dict):
        out: List[str] = []
        for key in sorted(set(old) | set(new)):
            if key in ("version", "updated_at", "updated_by"):
                continue
            out += _diff(old.get(key), new.get(key), f"{path}.{key}" if path else key)
        return out
    if isinstance(old, list) and isinstance(new, list) and path == "products":
        olds, news = {p["product_id"]: p for p in old}, {p["product_id"]: p for p in new}
        out = []
        for pid in sorted(set(olds) | set(news)):
            if pid not in olds:
                out.append(f"products.{pid} (added)")
            elif pid not in news:
                out.append(f"products.{pid} (removed)")
            else:
                out += _diff(olds[pid], news[pid], f"products.{pid}")
        return out
    return [] if old == new else [path]


class ConfigStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._active: Optional[Active] = None
        self._history: List[Dict[str, Any]] = []
        self._pinned: ContextVar[Optional[Active]] = ContextVar("pinned_config", default=None)

    # ---- reading (lock-free: the snapshot is immutable and swapped in one assignment) ----
    def current(self) -> Active:
        pinned = self._pinned.get()
        if pinned is not None:
            return pinned
        active = self._active
        if active is None:
            with self._lock:
                if self._active is None:
                    self._load()
                active = self._active
        assert active is not None
        return active

    @contextmanager
    def pinned(self) -> Iterator[Active]:
        """Everything inside the block uses one configuration version, even if an admin activates another meanwhile."""
        existing = self._pinned.get()
        if existing is not None:
            yield existing
            return
        token = self._pinned.set(self.current())
        try:
            yield self._pinned.get()  # type: ignore[misc]
        finally:
            self._pinned.reset(token)

    @property
    def version(self) -> int:
        return self.current().config.version

    def history(self) -> List[Dict[str, Any]]:
        self.current()
        return [{k: v for k, v in h.items() if k != "config"} for h in reversed(self._history)]

    # ---- persistence ----
    @staticmethod
    def _storage():
        import app.services.storage as storage

        return storage.storage_service

    def _reconcile(self, cfg: AdminConfig, base: PackData) -> AdminConfig:
        """Products added to or removed from the catalogue since the config was saved are brought in line."""
        ref = reference(base)
        have = {p.product_id for p in cfg.products}
        keep = [p for p in cfg.products if p.custom or p.product_id in base.products]
        added = [factory_product(p, ref) for pid, p in base.products.items() if pid not in have]
        if len(keep) == len(cfg.products) and not added:
            return cfg
        return cfg.model_copy(update={"products": keep + added})

    def _load(self) -> None:
        base = get_base_pack()
        doc = None
        try:
            doc = self._storage().get_admin_config()
        except Exception:  # noqa: BLE001 - an unreadable store must not stop the API starting
            log.exception("Could not read the saved admin configuration; starting from factory defaults")
        cfg: Optional[AdminConfig] = None
        history: List[Dict[str, Any]] = []
        if doc:
            try:
                cfg = self._reconcile(AdminConfig.model_validate(doc["active"]), base)
                build_pack(cfg, base)
                history = list(doc.get("history", []))
            except Exception:  # noqa: BLE001
                log.exception("The saved admin configuration is invalid; starting from factory defaults")
                cfg = None
        if cfg is None:
            cfg = factory_config(base)
            history = []
        self._history = history
        self._active = Active(cfg, build_pack(cfg, base))
        log.info("Admin configuration v%d is active", cfg.version)

    def reload(self) -> Active:
        """Re-reads what was last persisted and makes it active. Picks up an edited admin_config.json without a restart."""
        with self._lock:
            before = self._active.config.version if self._active else None
            self._active = None
            self._load()
            assert self._active is not None
            log.info("Admin configuration reloaded (v%s -> v%d)", before, self._active.config.version)
            return self._active

    # ---- updating ----
    def commit(
        self,
        build: Callable[[AdminConfig], Dict[str, Any]],
        actor: str,
        summary: str,
        expected_version: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Validate, persist, then activate. Either the whole new configuration is live afterwards, or the old one still is."""
        with self._lock:
            current = self.current()
            if expected_version is not None and expected_version != current.config.version:
                raise ConfigConflictError(
                    f"The configuration changed while you were editing: version {current.config.version} is now active."
                )
            base = get_base_pack()
            old = current.config.model_dump()
            draft = build(current.config)
            draft.update(version=current.config.version + 1, updated_at=_now(), updated_by=actor)
            try:
                new_cfg = AdminConfig.model_validate(draft)
                pack = build_pack(new_cfg, base)
            except ConfigInvalidError:
                raise
            except Exception as exc:  # noqa: BLE001 - pydantic's ValidationError and anything the builders raise
                raise ConfigInvalidError(str(exc)) from exc
            new_dump = new_cfg.model_dump()
            changed = _diff(old, new_dump)
            entry = {
                "version": new_cfg.version,
                "at": new_cfg.updated_at,
                "actor": actor,
                "summary": summary,
                "changed_fields": changed,
                "config": new_dump,
            }
            history = (self._history + [entry])[-HISTORY_LIMIT:]
            t0 = time.perf_counter()
            try:
                self._storage().save_admin_config({"active": new_dump, "history": history})
            except Exception as exc:  # noqa: BLE001
                log.exception("Could not persist the new configuration; the previous one stays active")
                raise ConfigPersistenceError("The configuration could not be saved, so nothing was changed.") from exc
            persisted_ms = (time.perf_counter() - t0) * 1000
            t1 = time.perf_counter()
            self._history = history
            self._active = Active(new_cfg, pack)  # the single assignment that makes it live
            return {
                "version": new_cfg.version,
                "updated_at": new_cfg.updated_at,
                "changed_fields": changed,
                "persisted_ms": round(persisted_ms, 3),
                "activation_ms": round((time.perf_counter() - t1) * 1000, 3),
            }

    def snapshot_of(self, version: int) -> Optional[Dict[str, Any]]:
        self.current()
        return next((h["config"] for h in self._history if h["version"] == version), None)


config_store = ConfigStore()


def apply_patch(cfg: AdminConfig, patch: ConfigPatch) -> Dict[str, Any]:
    """A new config dict with the patch laid over the current one. Unknown products are an error, not a silent no-op."""
    data = cfg.model_dump()
    if patch.needs:
        data["needs"].update(patch.needs.model_dump(exclude_none=True))
    if patch.underwriting:
        data["underwriting"].update(patch.underwriting.model_dump(exclude_none=True))
    for pp in patch.products or []:
        target = next((p for p in data["products"] if p["product_id"] == pp.product_id), None)
        if target is None:
            raise ConfigInvalidError(f"Unknown product {pp.product_id}.")
        update_product(target, pp.model_dump(exclude={"product_id"}, exclude_none=True, exclude_defaults=False))
    return data


def update_product(target: Dict[str, Any], changes: Dict[str, Any]) -> None:
    clear = changes.pop("clear_income_multiple", False)
    factors = changes.pop("gender_discount_factors", None)
    for key, value in changes.items():
        if value is not None:
            target[key] = value
    if factors:
        target["gender_discount_factors"].update({k: v for k, v in factors.items() if v is not None})
    if clear:
        target["maximum_income_multiple"] = None
