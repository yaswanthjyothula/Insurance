"""ULIP fund projection using the pack's published charges (a common simplification, as described in the pack).

Per month: units are bought from premium after the allocation charge, then the admin charge and the mortality charge
are deducted, then the fund grows at gross return minus the fund management charge. These are illustrations at fixed
return scenarios, never forecasts.
"""

from typing import Any, Dict, List, Optional

from app.pack.loader import get_pack
from app.pack.models import Product
from app.schemas.quote import Applicant
from app.schemas.ulip import UlipProjection, UlipProjectionRequest, UlipScenario, UlipYear
from app.services import premium


def _band_value(bands: List[Dict[str, Any]], year: int, key: str) -> float:
    for b in bands:
        if b["from_year"] <= year and (b["to_year"] is None or year <= b["to_year"]):
            return float(b[key])
    return 0.0


def _mortality(age: int, gender: str, smoker: bool) -> float:
    pack = get_pack()
    status = "smoker" if smoker else "non_smoker"
    return float(pack.mortality.get((min(age, 99), gender, status), pack.mortality.get((99, gender, status), 0)))


def _scenario(product: Product, app: Applicant, req: UlipProjectionRequest, fmc_pct: float, gross_pct: float) -> UlipScenario:
    charges = product.ulip_charges or {}
    allocation, admin = (
        charges.get("premium_allocation_charge_pct", []),
        charges.get("policy_admin_charge_inr_per_month", []),
    )
    ppt = premium.premium_paying_term(req.payment_option, req.policy_term_years)
    sa = req.annual_premium * req.sa_multiple
    net = (1 + (gross_pct - fmc_pct) / 100) ** (1 / 12) - 1
    fund, paid, total_charges = 0.0, 0.0, 0.0
    years: List[UlipYear] = []
    for month in range(req.policy_term_years * 12):
        year, in_year = month // 12 + 1, month % 12
        if in_year == 0 and year <= ppt:
            fee = req.annual_premium * _band_value(allocation, year, "pct") / 100
            fund += req.annual_premium - fee
            paid += req.annual_premium
            total_charges += fee
        death_benefit = max(sa, fund, 1.05 * paid)
        mortality = _mortality(app.age + year - 1, app.gender, app.smoker) / 12 * max(death_benefit - fund, 0) / 1000
        admin_fee = _band_value(admin, year, "inr")
        fund = max(0.0, fund - mortality - admin_fee)
        total_charges += mortality + admin_fee
        fund *= 1 + net
        if in_year == 11:
            years.append(
                UlipYear(
                    year=year,
                    premiums_paid=int(paid),
                    fund_value=int(fund),
                    death_benefit=int(max(sa, fund, 1.05 * paid)),
                )
            )
    return UlipScenario(
        gross_return_pct=gross_pct,
        net_return_pct=round(gross_pct - fmc_pct, 2),
        maturity_value=int(fund),
        total_premiums=int(paid),
        total_charges=int(total_charges),
        years=years,
    )


def project(req: UlipProjectionRequest) -> UlipProjection:
    pack = get_pack()
    product = pack.products.get(req.product_id)
    fund: Optional[Any] = pack.funds.get(req.fund_id)
    if product is None or not product.is_ulip or fund is None or req.fund_id not in product.ulip_fund_ids:
        raise KeyError("unknown ULIP product or fund")
    returns = [req.gross_return_pct] if req.gross_return_pct is not None else pack.assumptions.benefit_illustration_gross_returns_pct
    return UlipProjection(
        product_name=product.product_name,
        fund_name=fund.fund_name,
        sum_assured=int(req.annual_premium * req.sa_multiple),
        scenarios=[_scenario(product, req.applicant, req, fund.fmc_pct_pa, g) for g in returns],
        note="Illustrations at fixed return scenarios. Funds are fictional and returns are not guaranteed or forecast.",
    )
