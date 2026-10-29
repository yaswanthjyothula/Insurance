"""Transparent plan matching.

Every plan is scored on five published factors. The weights and the reason for each
score are returned with the result so the user can see exactly why a plan ranked where it did.
No trained model is used: there is no real purchase data to train on.
"""
import math
import uuid
from typing import List, Optional, Tuple

from app.schemas.products import (
    InsuranceProduct,
    RankedRecommendation,
    RecommendationRequest,
    RecommendationResponse,
    ScoreFactor,
)
from app.ml import ranker as ml_ranker
from app.services.catalog import get_products_by_category

MODEL_VERSION = "rules-v1 + hgb-ranker-synthetic-v1"

WEIGHTS = {
    "claims": 0.30,
    "strength": 0.15,
    "cover_fit": 0.25,
    "affordability": 0.15,
    "features": 0.15,
}
LABELS = {
    "claims": "Claim settlement record",
    "strength": "Insurer financial strength",
    "cover_fit": "Fit to your cover and term",
    "affordability": "Affordability",
    "features": "Riders and payout options",
}
KEY_RIDERS = {
    "critical illness": ("critical", "illness"),
    "accidental death": ("accident",),
    "waiver of premium": ("waiver",),
}


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


# ICICI's published first-year sample premiums for a healthy non-smoking salaried male, ₹1 Cr cover, regular pay:
# age 30 -> ₹11,342, age 40 -> ₹18,225, age 50 -> ₹34,532 (iProtect Smart Plus page, checked 2026-10-29).
# They are the only official price points we have, so the estimate interpolates between them and
# extends the nearest slope outside that range. It is the same for every plan.
_ANCHORS = [(30, 11342.0), (40, 18225.0), (50, 34532.0)]
SMOKER_FACTOR = 1.5  # assumption: smokers usually pay roughly 1.5x or more


def indicative_annual_premium(sum_assured: float, age: int, smoker: bool, term_years: int = 0) -> float:
    """Rough yearly premium for the given cover. Only the insurer's own quote is exact."""
    (a0, p0), (a1, p1), (a2, p2) = _ANCHORS
    if age <= a1:
        lo_age, lo_p, hi_age, hi_p = a0, p0, a1, p1
    else:
        lo_age, lo_p, hi_age, hi_p = a1, p1, a2, p2
    slope = (math.log(hi_p) - math.log(lo_p)) / (hi_age - lo_age)
    per_crore = lo_p * math.exp(slope * (age - lo_age))
    premium = per_crore * (sum_assured / 10_000_000.0) * (SMOKER_FACTOR if smoker else 1.0)
    return round(premium, 2)


class PlanMatcher:
    # ---- eligibility -------------------------------------------------
    @staticmethod
    def eligibility(p: InsuranceProduct, req: RecommendationRequest) -> Tuple[bool, List[str]]:
        reasons: List[str] = []
        if p.min_entry_age is not None and req.age < p.min_entry_age:
            reasons.append(f"Minimum entry age is {p.min_entry_age}")
        if p.max_entry_age is not None and req.age > p.max_entry_age:
            reasons.append(f"Maximum entry age is {p.max_entry_age} (you are {req.age})")
        min_term = p.min_term_years or 1
        if p.max_maturity_age and req.age + min_term > p.max_maturity_age:
            reasons.append(f"Cover would have to end after age {p.max_maturity_age}")
        return (not reasons), reasons

    # ---- inputs the plan can actually offer --------------------------
    @staticmethod
    def offered(p: InsuranceProduct, req: RecommendationRequest) -> Tuple[float, int]:
        wanted = max(req.coverage_gap, 0.0)
        sa = math.ceil(wanted / 100000.0) * 100000.0  # whole lakhs, rounded up so the gap is covered
        sa = max(p.min_sum_assured, min(sa, p.max_sum_assured))
        term = req.desired_tenure_years
        if p.max_term_years:
            term = min(term, p.max_term_years)
        if p.max_maturity_age:
            term = min(term, max(1, p.max_maturity_age - req.age))
        if p.min_term_years:
            term = max(term, p.min_term_years)
        return float(sa), int(term)

    # ---- factor scores -----------------------------------------------
    @staticmethod
    def f_claims(p: InsuranceProduct) -> Tuple[float, str]:
        if p.claim_settlement_ratio is None:
            return 0.5, "Claim settlement ratio not available for this insurer, so it gets a neutral score."
        s = clamp((p.claim_settlement_ratio - 97.0) / 3.0)
        basis = p.claim_ratio_basis or "claim settlement ratio"
        return s, f"{p.claim_settlement_ratio:g}% ({basis})."

    @staticmethod
    def f_strength(p: InsuranceProduct) -> Tuple[float, str]:
        if p.solvency_ratio is None:
            return 0.5, "Solvency ratio not available, so it gets a neutral score."
        s = clamp((p.solvency_ratio - 1.5) / 1.0)  # 1.5x (IRDAI minimum) scores 0, 2.5x or more scores 1
        return s, f"Solvency ratio {p.solvency_ratio:g}x against the IRDAI minimum of 1.5x."

    @staticmethod
    def f_cover_fit(p: InsuranceProduct, req: RecommendationRequest) -> Tuple[float, str]:
        notes = []
        if req.coverage_gap > p.max_sum_assured:
            sa_fit = p.max_sum_assured / req.coverage_gap
            notes.append(f"plan tops out at ₹{p.max_sum_assured / 10000000:.2f} Cr, below the ₹{req.coverage_gap / 10000000:.2f} Cr you need")
        elif p.min_sum_assured <= 0 and p.max_sum_assured >= 1e9 and "sum assured limits" in " ".join(p.unconfirmed_fields):
            sa_fit = 0.7
            notes.append("cover limits are not confirmed for this plan")
        elif p.min_sum_assured and req.coverage_gap < p.min_sum_assured:
            sa_fit = max(0.5, req.coverage_gap / p.min_sum_assured)
            notes.append(f"minimum cover is ₹{p.min_sum_assured / 100000:.0f} L, above your ₹{req.coverage_gap / 100000:.0f} L need")
        else:
            sa_fit = 1.0
            notes.append("can cover your full requirement")
        term_fit = 1.0
        wanted = req.desired_tenure_years
        allowed = wanted
        if p.max_term_years:
            allowed = min(allowed, p.max_term_years)
        if p.max_maturity_age:
            allowed = min(allowed, p.max_maturity_age - req.age)
        if allowed < wanted and wanted > 0:
            term_fit = max(0.0, allowed / wanted)
            notes.append(f"longest term you can get is {max(allowed, 0)} years, not {wanted}")
        elif p.min_term_years and wanted < p.min_term_years:
            term_fit = 0.8
            notes.append(f"shortest term is {p.min_term_years} years")
        else:
            notes.append(f"supports your {wanted}-year term")
        return clamp(0.6 * sa_fit + 0.4 * term_fit), "; ".join(notes).capitalize() + "."

    @staticmethod
    def f_affordability(monthly_premium: float, budget_monthly: float) -> Tuple[float, str]:
        if budget_monthly <= 0:
            return 0.5, "No budget available to compare against."
        ratio = monthly_premium / budget_monthly
        s = 1.0 if ratio <= 1 else clamp(1.0 - (ratio - 1.0))
        return s, f"Estimated ₹{monthly_premium:,.0f}/month against a budget of about ₹{budget_monthly:,.0f}/month (5% of your monthly income unless you set a budget)."

    @staticmethod
    def f_features(p: InsuranceProduct, req: RecommendationRequest) -> Tuple[float, str]:
        riders_text = " ".join(p.riders_available).lower()
        found = [name for name, keys in KEY_RIDERS.items() if any(k in riders_text for k in keys)]
        rider_score = len(found) / len(KEY_RIDERS)
        flex = clamp(len(p.death_benefit_options) / 3.0) if p.death_benefit_options else 0.5
        wants = [f.lower() for f in req.preferred_features]
        bonus = 0.0
        if wants:
            hay = (riders_text + " " + " ".join(p.death_benefit_options).lower() + " " + " ".join(p.key_features).lower())
            bonus = 0.2 * (sum(1 for w in wants if w in hay) / len(wants))
        score = clamp(0.5 * rider_score + 0.5 * flex + bonus)
        parts = []
        parts.append(f"riders: {', '.join(found) if found else 'none of the three key riders confirmed'}")
        if p.death_benefit_options:
            parts.append(f"payout options: {', '.join(p.death_benefit_options[:3])}")
        return score, "; ".join(parts).capitalize() + "."

    def score_plan(self, p: InsuranceProduct, req: RecommendationRequest, budget: float):
        """Everything the ranking needs for one plan. Used both when serving and when generating training data."""
        sa, term = self.offered(p, req)
        annual = indicative_annual_premium(sa, req.age, req.smoker_status, term)
        monthly = round(annual / 12.0, 2)
        scored = {
            "claims": self.f_claims(p),
            "strength": self.f_strength(p),
            "cover_fit": self.f_cover_fit(p, req),
            "affordability": self.f_affordability(monthly, budget),
            "features": self.f_features(p, req),
        }
        return sa, term, annual, monthly, scored

    # ---- main --------------------------------------------------------
    def recommend(self, req: RecommendationRequest) -> RecommendationResponse:
        products = get_products_by_category(req.preferred_category)
        budget = req.budget_monthly if req.budget_monthly and req.budget_monthly > 0 else (req.annual_income / 12.0) * 0.05

        ranked: List[RankedRecommendation] = []
        vectors: List[Optional[List[float]]] = []
        eligible_count = 0
        for p in products:
            ok, reasons = self.eligibility(p, req)
            unverified = ok and (p.min_entry_age is None or p.max_entry_age is None)
            sa, term, annual, monthly, scored = self.score_plan(p, req, budget)
            factors = [ScoreFactor(key=k, label=LABELS[k], weight=WEIGHTS[k], score=round(v[0], 3), detail=v[1]) for k, v in scored.items()]
            total = sum(WEIGHTS[k] * v[0] for k, v in scored.items())
            rule_total = total
            vectors.append(ml_ranker.build_vector({k: v[0] for k, v in scored.items()}, annual, req.annual_income, req.age, req.coverage_gap, req.dependents_count, req.smoker_status, term, req.priority) if ok else None)
            if not ok:
                total *= 0.1
            elif not unverified:
                eligible_count += 1

            ordered = sorted(factors, key=lambda f: f.score * f.weight, reverse=True)
            best = ordered[0]
            weakest = min(factors, key=lambda f: f.score)
            if unverified:
                why = "We could not confirm this plan's entry age limits from the insurer's documents, so we can't say you qualify. " + f"On the facts we do have, it is strongest on {best.label.lower()}: {best.detail}"
            elif ok:
                why = f"Strongest on {best.label.lower()}: {best.detail}"
                if weakest.score < 0.6 and weakest.key != best.key:
                    why += f" Weaker on {weakest.label.lower()}: {weakest.detail}"
            else:
                why = "Not available for you: " + "; ".join(reasons) + "."

            pros: List[str] = []
            if p.claim_settlement_ratio is not None:
                pros.append(f"Claim settlement {p.claim_settlement_ratio:g}% ({p.claim_ratio_basis or 'insurer-reported'})")
            if p.solvency_ratio is not None:
                pros.append(f"Solvency {p.solvency_ratio:g}x (IRDAI minimum 1.5x)")
            pros += p.key_features[:2]
            cons = list(p.exclusions[:2])
            if sa < req.coverage_gap:
                cons.append(f"Covers up to ₹{sa / 10000000:.2f} Cr of the ₹{req.coverage_gap / 10000000:.2f} Cr you need")
            if p.min_entry_age is None or p.max_entry_age is None:
                cons.append("Entry age limits could not be confirmed, so your eligibility is not verified")
            if p.unconfirmed_fields:
                cons.append("Not confirmed from official documents: " + ", ".join(p.unconfirmed_fields))

            ranked.append(RankedRecommendation(
                rank=1,
                product=p,
                suitability_score=round(total, 3),
                match_percent=int(round(total * 100)),
                rule_percent=int(round(rule_total * 100)),
                score_breakdown=factors,
                suggested_sum_assured=sa,
                suggested_term_years=term,
                eligibility_status=("eligibility_unconfirmed" if unverified else "eligible") if ok else "unsuitable: " + ", ".join(reasons),
                estimated_annual_premium=annual,
                estimated_monthly_premium=monthly,
                premium_is_estimate=True,
                grounded_explanation=why,
                pros=pros,
                cons=cons,
            ))

        # Blend in the trained model for plans the user can actually buy (entry-age rules always come first)
        idx = [i for i, v in enumerate(vectors) if v is not None]
        probs = ml_ranker.predict([vectors[i] for i in idx]) if idx else None
        method = "rules"
        if probs:
            top = max(probs) or 1.0
            for i, pr in zip(idx, probs):
                r = ranked[i]
                rel = pr / top
                r.model_percent = int(round(rel * 100))
                blended = 0.5 * (r.rule_percent / 100.0) + 0.5 * rel
                r.suitability_score = round(blended, 3)
                r.match_percent = int(round(blended * 100))
            method = "rules+trained-model"

        def tier(r: RankedRecommendation) -> int:
            return 0 if r.eligibility_status == "eligible" else 1 if r.eligibility_status == "eligibility_unconfirmed" else 2

        ranked.sort(key=lambda r: (tier(r), -r.suitability_score))
        for i, r in enumerate(ranked):
            r.rank = i + 1

        return RecommendationResponse(
            recommendation_id=str(uuid.uuid4()),
            model_version=MODEL_VERSION,
            ranking_method=method,
            recommendations=ranked,
            total_evaluated=len(products),
            eligible_count=eligible_count,
            methodology_note=(
                "Plans are first filtered by hard eligibility (entry age and maturity age), then scored on five factors: "
                + ", ".join(f"{LABELS[k].lower()} {int(w * 100)}%" for k, w in WEIGHTS.items())
                + ". Claim and solvency figures come from IRDAI and insurer disclosures; each is shown with its source. "
                "Premiums are indicative estimates calibrated to one insurer's published sample prices and applied the same way to every plan, so they do not favour any insurer. "
                + (" Each plan is then also scored by a scikit-learn model trained on synthetic households for your stated priority (" + ml_ranker.PRIORITY_LABELS.get(req.priority, "Balanced") + "). The final match is half the rule score and half the model fit. The model was not trained on real purchases, see its disclosure." if method == "rules+trained-model" else "")
                + " Always get an exact quote from the insurer before buying."
            ),
        )

    def methodology(self) -> dict:
        return {
            "version": MODEL_VERSION,
            "type": "transparent weighted scoring blended with a scikit-learn ranker trained on synthetic data",
            "weights": WEIGHTS,
            "factors": LABELS,
        }


plan_matcher = PlanMatcher()
