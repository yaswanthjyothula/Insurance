import os
import json
import re
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.financial import AssessmentInput

GROUNDED_SYSTEM_PROMPT = """
You are LifeSure AI Assistant, a specialized, prudent, and objective insurance and financial education companion for Indian families.
Key Boundaries and Mandatory Rules:
1. Grounded & Factual: Base your guidance on deterministic calculation outcomes and verified Indian regulatory frameworks (IRDAI).
2. Never Fabricate: Never invent claim settlement ratios, non-existent policy benefits, guaranteed investment returns, or insurer partnerships.
3. Decoupled Role: Never calculate human life value or financial gap yourself; reference the user's provided calculation metrics.
4. Non-Advisory Disclaimer: You provide educational guidance, not formal SEBI/IRDAI regulated financial advice. When users ask for binding contract endorsements, direct them to book an accredited fiduciary advisor.
5. Tone: Professional, editorial, trustworthy, empathetic, and clear. Avoid hype or pressure tactics.
"""

PRIMARY_MODEL = "gemini-3.1-flash-lite"
FALLBACK_MODEL = "gemini-3.5-flash-lite"

class GeminiAssistantService:
    @classmethod
    async def chat(cls, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        
        ctx_text = ""
        if context:
            ctx_text = f"\nUser Context: Age: {context.get('age', 'N/A')}, Coverage Gap: ₹{context.get('coverage_gap', 0):,}, Dependents: {context.get('dependents', 'N/A')}\n"
            
        full_prompt = f"{GROUNDED_SYSTEM_PROMPT}\n{ctx_text}\nUser Question: {message}\nAssistant:"
        
        if api_key and len(api_key) > 5:
            for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    payload = {
                        "contents": [{
                            "parts": [{"text": full_prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.2,
                            "maxOutputTokens": 800
                        }
                    }
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            reply = data["candidates"][0]["content"]["parts"][0]["text"]
                            return {
                                "reply": reply.strip(),
                                "model": model_name,
                                "grounded": True
                            }
                except Exception:
                    continue

        # Deterministic fallback
        msg_lower = message.lower()
        if "claim" in msg_lower:
            reply = (
                "For life insurance claims in India, the nominee must notify the insurer within 30 days, "
                "submit the certified Municipal Death Certificate, original policy certificate, and bank details. "
                "Under Section 45 of the Insurance Act, after 3 continuous policy years, the insurer cannot question "
                "or reject a claim on grounds of non-fraudulent misstatement. You can use our Claim Companion tool "
                "for the complete verified checklist."
            )
        elif "term" in msg_lower and ("whole" in msg_lower or "endowment" in msg_lower or "traditional" in msg_lower):
            reply = (
                "Pure Term Insurance provides high death benefit protection at low cost with zero maturity returns, "
                "making it ideal for income replacement and debt shielding. In contrast, Traditional/Endowment plans "
                "bundle low life cover with modest guaranteed or bonus returns (typically 4-6% p.a.). We recommend "
                "keeping pure protection and wealth investment distinct to maximize coverage affordably."
            )
        elif "hlv" in msg_lower or "human life value" in msg_lower:
            reply = (
                "Human Life Value (HLV) measures the discounted present value of your future net earnings that would "
                "financially support your dependents. LifeSure AI computes this using your age, income growth assumptions, "
                "and personal consumption deductions, allowing you to cross-reference it with the Capital Needs method."
            )
        elif "riders" in msg_lower:
            reply = (
                "Valuable riders to consider alongside term life insurance include: Critical Illness Rider (provides lump sum "
                "upon diagnosis of specified conditions), Accidental Total Disability Rider, and Waiver of Premium Rider "
                "(waives future premiums if disabled while keeping your cover active)."
            )
        else:
            reply = (
                "LifeSure AI helps you calculate deterministic coverage requirements, compare scenarios like welcoming a child "
                "or buying a home, and inspect policy clauses through Policy X-Ray. Please run an assessment or consult our "
                "Learning Centre for verified guidance."
            )
            
        return {
            "reply": reply,
            "model": "lifesure-deterministic-advisor",
            "grounded": True
        }

    @classmethod
    async def interpret_custom_scenario(
        cls,
        user_prompt: str,
        baseline: AssessmentInput
    ) -> Dict[str, Any]:
        """
        Uses Gemini to extract financial parameter shifts from free-text life scenarios.
        Outputs structured overrides, additional goals, analysis, and recommendations.
        """
        api_key = settings.GEMINI_API_KEY
        
        system_instruction = (
            "You are an expert actuarial and financial planner for Indian households at LifeSure AI. "
            "The user describes a real-life transition, life event, or financial shift in free text. "
            "Your task is to identify realistic financial parameter adjustments to the user's baseline profile. "
            "Strictly return valid JSON only."
        )
        
        prompt = f"""{system_instruction}

User Baseline Financial Profile:
- Age: {baseline.age}
- Annual Income: ₹{baseline.annual_income:,.0f}
- Annual Expenses: ₹{baseline.annual_expenses:,.0f}
- Dependents Count: {baseline.dependents_count}
- Outstanding Liabilities: ₹{baseline.outstanding_liabilities:,.0f}
- Existing Cover: ₹{baseline.existing_cover:,.0f}
- Liquid/Eligible Assets: ₹{baseline.eligible_assets:,.0f}
- Planned Retirement Age: {baseline.retirement_age}
- Support Horizon Years: {baseline.support_horizon_years or max(10, baseline.retirement_age - baseline.age)}

Real-Life Scenario Described by User:
"{user_prompt}"

Return a single JSON object with the following schema:
{{
  "scenario_title": "A crisp 3-6 word title (e.g. Twins Arrival & Home Loan)",
  "ai_analysis": "2-3 sentences explaining the financial risk exposure, dependency changes, and why protection needs shift.",
  "overrides": {{
    // only include fields from AssessmentInput that are modified by this scenario:
    // "annual_income": float,
    // "annual_expenses": float,
    // "outstanding_liabilities": float,
    // "dependents_count": int,
    // "retirement_age": int,
    // "support_horizon_years": int,
    // "eligible_assets": float
  }},
  "added_goals": [
    // optional list of new future goals created by this scenario:
    // {{"name": "Goal name", "cost_today": float, "years_away": int, "category": "education" | "marriage" | "wealth" | "other"}}
  ],
  "actionable_recommendations": [
    "3 specific, practical recommendations on term cover, emergency fund buffers, or riders to mitigate this scenario's risks."
  ]
}}
"""

        if api_key and len(api_key) > 5:
            for model_name in [PRIMARY_MODEL, FALLBACK_MODEL]:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.2,
                            "response_mime_type": "application/json"
                        }
                    }
                    async with httpx.AsyncClient(timeout=14.0) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                            parsed = json.loads(raw_text)
                            
                            # Validate & clean overrides
                            overrides = parsed.get("overrides", {})
                            cleaned_overrides = {}
                            for k, v in overrides.items():
                                if k in type(baseline).model_fields and v is not None:
                                    try:
                                        if k in ("age", "dependents_count", "retirement_age", "support_horizon_years"):
                                            cleaned_overrides[k] = max(0, int(v))
                                        else:
                                            cleaned_overrides[k] = max(0.0, float(v))
                                    except (ValueError, TypeError):
                                        pass
                                        
                            return {
                                "scenario_title": parsed.get("scenario_title", "Custom Real-Life Scenario"),
                                "ai_analysis": parsed.get("ai_analysis", "AI simulated financial transition based on your life update."),
                                "overrides": cleaned_overrides,
                                "added_goals": parsed.get("added_goals", []),
                                "actionable_recommendations": parsed.get("actionable_recommendations", [
                                    "Review your life insurance coverage gap to ensure family security.",
                                    "Build an emergency fund covering 6-12 months of living expenses.",
                                    "Consider key riders like Critical Illness and Accidental Disability."
                                ]),
                                "model_used": model_name
                            }
                except Exception as e:
                    continue

        # Heuristic deterministic fallback
        return cls._heuristic_scenario_parser(user_prompt, baseline)

    @classmethod
    def _heuristic_scenario_parser(cls, prompt: str, baseline: AssessmentInput) -> Dict[str, Any]:
        """
        Deterministic parser fallback for custom scenarios when external API is unreachable.
        """
        p_lower = prompt.lower()
        overrides = {}
        added_goals = []
        notes = []
        
        # Child / Baby / Twins
        if "twin" in p_lower:
            overrides["dependents_count"] = baseline.dependents_count + 2
            overrides["annual_expenses"] = round(baseline.annual_expenses * 1.30, 2)
            added_goals.append({
                "name": "Twins Higher Education Fund",
                "cost_today": 4000000.0,
                "years_away": 18,
                "category": "education"
            })
            notes.append("Arrival of twins increases dependents by +2 and living expenses by 30%.")
        elif any(w in p_lower for w in ["child", "baby", "kid", "born", "pregnant"]):
            overrides["dependents_count"] = baseline.dependents_count + 1
            overrides["annual_expenses"] = round(baseline.annual_expenses * 1.15, 2)
            added_goals.append({
                "name": "Child Higher Education Fund",
                "cost_today": 2500000.0,
                "years_away": 18,
                "category": "education"
            })
            notes.append("Welcoming a child increases dependents by +1 and raises living expenses by 15%.")

        # Home loan / Mortgage / Car loan / Debt
        loan_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|cr|crore|l|k)?\s*(?:loan|mortgage|debt|borrow)', p_lower)
        if "home loan" in p_lower or "mortgage" in p_lower or "flat" in p_lower or "house" in p_lower:
            added_debt = 5000000.0
            if "80" in p_lower: added_debt = 8000000.0
            elif "1" in p_lower and "cr" in p_lower: added_debt = 10000000.0
            elif "75" in p_lower: added_debt = 7500000.0
            overrides["outstanding_liabilities"] = baseline.outstanding_liabilities + added_debt
            notes.append(f"Taking a fresh home mortgage adds ₹{added_debt:,.0f} in liabilities that require term protection.")
        elif any(w in p_lower for w in ["loan", "debt", "borrow"]):
            added_debt = 2000000.0
            overrides["outstanding_liabilities"] = baseline.outstanding_liabilities + added_debt
            notes.append(f"New borrowing adds ₹{added_debt:,.0f} in debt obligations.")

        # Startup / Business / Sabbatical / Career Break
        if any(w in p_lower for w in ["startup", "business", "quit", "sabbatical", "venture", "career break"]):
            overrides["annual_income"] = round(baseline.annual_income * 0.5, 2)
            notes.append("Career transition or startup venture models a temporary 50% income drop.")

        # Retirement changes
        retire_match = re.search(r'retire.*?(\d{2})', p_lower)
        if retire_match:
            r_age = int(retire_match.group(1))
            if 40 <= r_age <= 75:
                overrides["retirement_age"] = r_age
                notes.append(f"Retirement age adjusted to {r_age}.")

        title = "Custom Life Transition"
        if "twin" in p_lower or "baby" in p_lower or "child" in p_lower:
            title = "Family Expansion & Protection Shift"
        elif "loan" in p_lower or "home" in p_lower:
            title = "New Mortgage & Debt Protection"
        elif "startup" in p_lower or "business" in p_lower:
            title = "Entrepreneurship & Income Shock"

        return {
            "scenario_title": title,
            "ai_analysis": " ".join(notes) if notes else "Custom scenario applied to baseline parameters.",
            "overrides": overrides,
            "added_goals": added_goals,
            "actionable_recommendations": [
                "Increase pure term cover to protect your family against added liabilities and expenses.",
                "Maintain a 6 to 12 month liquid emergency fund in safe deposits.",
                "Ensure health insurance and comprehensive critical illness riders are active."
            ],
            "model_used": "lifesure-heuristic-engine"
        }
