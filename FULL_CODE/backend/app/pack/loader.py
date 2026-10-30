"""Loads the problem pack's CSV and JSON files once and indexes them for fast lookup.

The pack is data only and is not committed (see README for where to put it). Loading fails with a clear
message if the folder is missing, so the API never serves half-loaded data.
"""

import csv
import json
import logging
from dataclasses import dataclass, field
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple

from app.core.config import settings
from app.pack.models import (
    Advisor,
    Assumptions,
    Fund,
    Goal,
    Liability,
    Product,
    Profile,
    Rider,
    Slot,
    Spouse,
)

log = logging.getLogger("lifesure.pack")

REQUIRED_FILES = [
    "products.json",
    "riders.csv",
    "premium_rates.csv",
    "ulip_funds.csv",
    "ulip_mortality_charges.csv",
    "customer_profiles.json",
    "advisors.csv",
    "advisor_slots.csv",
    "reference_assumptions.json",
]
RATE_KEY = Tuple[str, str, int, int, str, str]  # product, payment option, entry age, term, gender, smoker
BANDS = ("18_30", "31_40", "41_50", "51_60", "61_65")


class PackNotFoundError(RuntimeError):
    """Raised when the problem pack's data folder or one of its files is missing."""


@dataclass
class PackData:
    products: Dict[str, Product]
    riders: Dict[str, Rider]
    funds: Dict[str, Fund]
    rates: Dict[RATE_KEY, Decimal]
    mortality: Dict[Tuple[int, str, str], Decimal]
    profiles: Dict[str, Profile]
    advisors: Dict[str, Advisor]
    slots: List[Slot]
    assumptions: Assumptions
    terms_by_product: Dict[Tuple[str, str, int, str, str], List[int]] = field(default_factory=dict)


def _split(value: str) -> List[str]:
    return [v for v in (value or "").split(";") if v]


def _opt_int(value: str):
    return int(float(value)) if value not in ("", None) else None


def _opt_float(value: str):
    return float(value) if value not in ("", None) else None


def _read_csv(path: Path) -> List[dict]:
    with path.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def _load_products(root: Path) -> Dict[str, Product]:
    raw = json.loads((root / "products.json").read_text(encoding="utf-8"))
    out = {}
    for item in raw:
        for key in ("premium_payment_options", "premium_modes"):
            if isinstance(item.get(key), str):
                item[key] = _split(item[key])
        for key in ("riders_allowed", "ulip_fund_ids"):
            if isinstance(item.get(key), str):
                item[key] = _split(item[key])
            item[key] = item.get(key) or []
        item["sa_band_factors"] = item.get("sa_band_factors") or []
        item["income_multiple_limits"] = item.get("income_multiple_limits") or []
        out[item["product_id"]] = Product(**item)
    return out


def _load_riders(root: Path) -> Dict[str, Rider]:
    out = {}
    for r in _read_csv(root / "riders.csv"):
        out[r["rider_id"]] = Rider(
            rider_id=r["rider_id"],
            rider_name=r["rider_name"],
            rider_category=r["rider_category"],
            benefit=r["benefit"],
            available_on_product_ids=_split(r["available_on_product_ids"]),
            min_entry_age=int(r["min_entry_age"]),
            max_entry_age=int(r["max_entry_age"]),
            max_cover_age=int(r["max_cover_age"]),
            min_rider_sa_inr=_opt_int(r["min_rider_sa_inr"]),
            max_rider_sa_inr=_opt_int(r["max_rider_sa_inr"]),
            max_rider_sa_pct_of_base_sa=_opt_int(r["max_rider_sa_pct_of_base_sa"]),
            rider_sa_rule=r["rider_sa_rule"],
            rate_basis=r["rate_basis"],
            band_rates={b: _opt_float(r[f"rate_entry_age_{b}"]) for b in BANDS},
            smoker_multiplier=float(r["smoker_multiplier"] or 1),
            max_premium_pct_of_base_premium=_opt_int(r["max_premium_pct_of_base_premium"]),
        )
    return out


def _load_funds(root: Path) -> Dict[str, Fund]:
    return {
        f["fund_id"]: Fund(
            fund_id=f["fund_id"],
            fund_name=f["fund_name"],
            asset_class=f["asset_class"],
            risk_level=f["risk_level"],
            fmc_pct_pa=float(f["fmc_pct_pa"]),
            objective=f["objective"],
        )
        for f in _read_csv(root / "ulip_funds.csv")
    }


def _load_rates(root: Path):
    rates: Dict[RATE_KEY, Decimal] = {}
    terms: Dict[Tuple[str, str, int, str, str], List[int]] = {}
    for r in _read_csv(root / "premium_rates.csv"):
        key = (
            r["product_id"],
            r["premium_payment_option"],
            int(r["entry_age"]),
            int(r["policy_term_years"]),
            r["gender"],
            r["smoker_status"],
        )
        rates[key] = Decimal(r["rate_per_1000_sa_inr"])
        terms.setdefault((key[0], key[1], key[2], key[4], key[5]), []).append(key[3])
    for ts in terms.values():
        ts.sort()
    return rates, terms


def _load_profiles(root: Path) -> Dict[str, Profile]:
    out = {}
    for p in json.loads((root / "customer_profiles.json").read_text(encoding="utf-8")):
        dep = p.get("dependents") or {}
        spouse = dep.get("spouse")
        cover, sav, health, pref = (
            p.get("existing_life_cover") or {},
            p.get("savings_and_investments") or {},
            p.get("health") or {},
            p.get("preferences") or {},
        )
        out[p["profile_id"]] = Profile(
            profile_id=p["profile_id"],
            full_name=p["full_name"],
            age=p["age"],
            gender=p["gender"],
            city=p.get("city", ""),
            residency_status=p.get("residency_status", "resident"),
            marital_status=p.get("marital_status", ""),
            employment_type=p.get("employment_type", ""),
            occupation=p.get("occupation", ""),
            annual_income_inr=p.get("annual_income_inr") or 0,
            expected_income_growth_pct=p.get("expected_income_growth_pct") or 6.0,
            monthly_household_expenses_inr=p.get("monthly_household_expenses_inr") or 0,
            spouse=Spouse(**{k: spouse.get(k) for k in ("age", "working", "annual_income_inr") if spouse.get(k) is not None})
            if spouse
            else None,
            children_ages=[c["age"] for c in dep.get("children") or []],
            parent_ages=[c["age"] for c in dep.get("parents") or []],
            liabilities=[Liability(**{k: v for k, v in li.items() if v is not None}) for li in p.get("liabilities") or []],
            employer_group_cover_inr=cover.get("employer_group_inr") or 0,
            individual_cover_inr=cover.get("individual_inr") or 0,
            liquid_savings_inr=sav.get("liquid_savings_inr") or 0,
            market_investments_inr=sav.get("market_investments_inr") or 0,
            retirement_savings_inr=sav.get("retirement_savings_inr") or 0,
            goals=[Goal(**g) for g in p.get("goals") or []],
            smoker_status=health.get("smoker_status", "non_smoker"),
            bmi=health.get("bmi"),
            health_conditions=health.get("conditions") or [],
            risk_appetite=pref.get("risk_appetite", "moderate"),
            monthly_premium_budget_inr=pref.get("monthly_premium_budget_inr") or 0,
            preferred_policy_term_years=pref.get("preferred_policy_term_years"),
            profile_date=p.get("profile_date", ""),
        )
    return out


def _load_advisors(root: Path) -> Dict[str, Advisor]:
    return {
        a["advisor_id"]: Advisor(
            advisor_id=a["advisor_id"],
            advisor_name=a["advisor_name"],
            languages=_split(a["languages"]),
            specialisations=_split(a["specialisations"]),
            consultation_modes=_split(a["consultation_modes"]),
            years_experience=int(a["years_experience"]),
            rating=float(a["rating"]),
            review_count=int(a["review_count"]),
        )
        for a in _read_csv(root / "advisors.csv")
    }


def _load_assumptions(root: Path) -> Assumptions:
    raw = json.loads((root / "reference_assumptions.json").read_text(encoding="utf-8"))["assumptions"]
    return Assumptions(**{k: v["value"] for k, v in raw.items() if k in Assumptions.model_fields})


@lru_cache(maxsize=1)
def get_pack() -> PackData:
    root = Path(settings.DATA_DIR)
    missing = [f for f in REQUIRED_FILES if not (root / f).exists()]
    if missing:
        raise PackNotFoundError(f"Problem pack files not found in {root}: {', '.join(missing)}. See README, 'Where to put the data'.")
    rates, terms = _load_rates(root)
    mortality = {
        (int(m["attained_age"]), m["gender"], m["smoker_status"]): Decimal(m["annual_rate_per_1000_sum_at_risk_inr"])
        for m in _read_csv(root / "ulip_mortality_charges.csv")
    }
    slots = [
        Slot(
            slot_id=s["slot_id"],
            advisor_id=s["advisor_id"],
            slot_start=s["slot_start"],
            slot_end=s["slot_end"],
            status=s["status"],
        )
        for s in _read_csv(root / "advisor_slots.csv")
    ]
    pack = PackData(
        products=_load_products(root),
        riders=_load_riders(root),
        funds=_load_funds(root),
        rates=rates,
        mortality=mortality,
        profiles=_load_profiles(root),
        advisors=_load_advisors(root),
        slots=slots,
        assumptions=_load_assumptions(root),
        terms_by_product=terms,
    )
    log.info(
        "Loaded pack: %d products, %d rates, %d profiles, %d slots",
        len(pack.products),
        len(rates),
        len(pack.profiles),
        len(slots),
    )
    return pack
