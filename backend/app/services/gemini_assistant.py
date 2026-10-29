import os
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

GROUNDED_SYSTEM_PROMPT = """
You are LifeSure AI Assistant, a specialized, prudent, and objective insurance and financial education companion for Indian families.
Key Boundaries and Mandatory Rules:
1. Grounded & Factual: Base your guidance on deterministic calculation outcomes and verified Indian regulatory frameworks (IRDAI).
2. Never Fabricate: Never invent claim settlement ratios, non-existent policy benefits, guaranteed investment returns, or insurer partnerships.
3. Decoupled Role: Never calculate human life value or financial gap yourself; reference the user's provided calculation metrics.
4. Non-Advisory Disclaimer: You provide educational guidance, not formal SEBI/IRDAI regulated financial advice. When users ask for binding contract endorsements, direct them to book an accredited fiduciary advisor.
5. Tone: Professional, editorial, trustworthy, empathetic, and clear. Avoid hype or pressure tactics.
"""

class GeminiAssistantService:
    @classmethod
    async def chat(cls, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        
        # Build prompt context
        ctx_text = ""
        if context:
            ctx_text = f"\nUser Context: Age: {context.get('age', 'N/A')}, Coverage Gap: ₹{context.get('coverage_gap', 0):,}, Dependents: {context.get('dependents', 'N/A')}\n"
            
        full_prompt = f"{GROUNDED_SYSTEM_PROMPT}\n{ctx_text}\nUser Question: {message}\nAssistant:"
        
        # If API key is provided, query Gemini REST API
        if api_key and len(api_key) > 5:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": full_prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 800
                    }
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {
                            "reply": reply,
                            "model": "gemini-1.5-flash",
                            "grounded": True
                        }
            except Exception:
                pass # Fall back to curated deterministic answer

        # High-quality deterministic fallback for insurance concepts
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
