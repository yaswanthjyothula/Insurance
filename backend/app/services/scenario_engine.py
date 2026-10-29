import copy
import uuid
from typing import Dict, Any, List
from app.schemas.financial import AssessmentInput, AssessmentResult, FutureGoal
from app.schemas.scenarios import ScenarioInput, ScenarioDiff, ScenarioComparisonResult
from app.services.financial_engine import FinancialEngine

class ScenarioEngine:
    @staticmethod
    def calculate_estimated_term_premium(sum_assured: float, age: int, smoker: bool) -> float:
        """Indicative yearly term premium. Uses the same calibrated estimate as plan matching."""
        if sum_assured <= 0:
            return 0.0
        from app.services.matching import indicative_annual_premium
        return indicative_annual_premium(sum_assured, age, smoker)

    @classmethod
    def apply_scenario(
        cls,
        baseline_input: AssessmentInput,
        scenario: ScenarioInput
    ) -> ScenarioComparisonResult:
        # Create a deep copy to ensure baseline is NEVER mutated
        sc_input_dict = baseline_input.model_dump()
        diffs: List[ScenarioDiff] = []
        explanation_parts: List[str] = []
        stype = scenario.scenario_type
        
        if stype == "another_child":
            # 1. Increment dependents
            old_dep = sc_input_dict["dependents_count"]
            new_dep = old_dep + 1
            sc_input_dict["dependents_count"] = new_dep
            diffs.append(ScenarioDiff(
                field="dependents_count",
                label="Number of Dependents",
                baseline_value=old_dep,
                scenario_value=new_dep,
                difference_str="+1 Dependent"
            ))
            
            # 2. Add future higher education milestone
            goals = sc_input_dict.get("future_goals", [])
            new_goal = {
                "name": f"New Child Higher Education (Milestone)",
                "cost_today": 2500000.0, # ₹25 Lakhs today
                "years_away": 18,
                "category": "education"
            }
            goals.append(new_goal)
            sc_input_dict["future_goals"] = goals
            diffs.append(ScenarioDiff(
                field="future_goals",
                label="Future Milestone Goals",
                baseline_value=len(goals) - 1,
                scenario_value=len(goals),
                difference_str="+₹25.0 Lakh Education Fund (in 18 yrs)"
            ))
            
            # 3. Increase household expenses by 15%
            old_exp = sc_input_dict["annual_expenses"]
            new_exp = round(old_exp * 1.15, 2)
            sc_input_dict["annual_expenses"] = new_exp
            diffs.append(ScenarioDiff(
                field="annual_expenses",
                label="Annual Household Expenses",
                baseline_value=f"₹{old_exp:,.0f}",
                scenario_value=f"₹{new_exp:,.0f}",
                difference_str=f"+₹{new_exp - old_exp:,.0f}/yr (+15%)"
            ))
            explanation_parts.append(
                "Welcoming another child increases long-term household living needs by 15% "
                "and establishes a new dedicated education funding goal of ₹25 Lakhs."
            )

        elif stype == "retire_55":
            old_retire = sc_input_dict["retirement_age"]
            # Retiring early can only shorten the earning window, never extend it
            new_retire = min(old_retire, 55)
            sc_input_dict["retirement_age"] = new_retire
            new_window = max(5, new_retire - sc_input_dict["age"])
            current_horizon = sc_input_dict.get("support_horizon_years")
            # Keep a user-chosen support horizon unless the new window is shorter
            sc_input_dict["support_horizon_years"] = min(current_horizon, new_window) if current_horizon else new_window
            diffs.append(ScenarioDiff(
                field="retirement_age",
                label="Retirement Age",
                baseline_value=old_retire,
                scenario_value=new_retire,
                difference_str=f"-{old_retire - new_retire} Years" if old_retire > new_retire else "No change"
            ))
            if old_retire > new_retire:
                explanation_parts.append(
                    f"Retiring early at age 55 compresses the earning window by {old_retire - new_retire} years, "
                    "which adjusts the human life value and shortens the active debt repayment horizon."
                )
            else:
                explanation_parts.append(
                    f"You already plan to retire at {old_retire}, which is at or before 55, so this scenario changes nothing."
                )

        elif stype in ("income_down_20", "income_drop_20"):
            old_inc = sc_input_dict["annual_income"]
            new_inc = round(old_inc * 0.80, 2)
            sc_input_dict["annual_income"] = new_inc
            diffs.append(ScenarioDiff(
                field="annual_income",
                label="Annual Income",
                baseline_value=f"₹{old_inc:,.0f}",
                scenario_value=f"₹{new_inc:,.0f}",
                difference_str=f"-₹{old_inc - new_inc:,.0f} (-20%)"
            ))
            explanation_parts.append(
                "A 20% income reduction highlights affordability stress and reflects reduced lifetime earning capacity."
            )

        elif stype == "loan_cleared":
            old_liab = sc_input_dict["outstanding_liabilities"]
            sc_input_dict["outstanding_liabilities"] = 0.0
            diffs.append(ScenarioDiff(
                field="outstanding_liabilities",
                label="Outstanding Debt Obligations",
                baseline_value=f"₹{old_liab:,.0f}",
                scenario_value="₹0",
                difference_str=f"-₹{old_liab:,.0f} (Fully Cleared)"
            ))
            explanation_parts.append(
                f"Completely retiring ₹{old_liab:,.0f} in outstanding debt reduces your gross capital requirement rupee-for-rupee."
            )

        elif stype == "add_home_loan":
            old_liab = sc_input_dict["outstanding_liabilities"]
            loan_added = 5000000.0 # ₹50 Lakhs
            new_liab = old_liab + loan_added
            sc_input_dict["outstanding_liabilities"] = new_liab
            diffs.append(ScenarioDiff(
                field="outstanding_liabilities",
                label="Outstanding Debt Obligations",
                baseline_value=f"₹{old_liab:,.0f}",
                scenario_value=f"₹{new_liab:,.0f}",
                difference_str=f"+₹{loan_added:,.0f} (New Home Loan)"
            ))
            explanation_parts.append(
                "Taking on a new ₹50 Lakh home mortgage creates an immediate liability that your family would need protected."
            )

        elif stype in ("custom", "ai_custom"):
            # Check for added goals
            if "added_goals" in scenario.overrides:
                current_goals = list(sc_input_dict.get("future_goals", []))
                for g in scenario.overrides["added_goals"]:
                    current_goals.append(g)
                    diffs.append(ScenarioDiff(
                        field="future_goals",
                        label="New Goal Added",
                        baseline_value="-",
                        scenario_value=g.get("name", "Goal"),
                        difference_str=f"+₹{g.get('cost_today', 0):,.0f} ({g.get('name', 'Goal')})"
                    ))
                sc_input_dict["future_goals"] = current_goals

            # Apply explicit user/AI overrides
            money_fields = {"annual_income", "annual_expenses", "outstanding_liabilities", "existing_cover", "eligible_assets"}
            for key, val in scenario.overrides.items():
                if key == "added_goals":
                    continue
                if key in sc_input_dict and sc_input_dict[key] != val:
                    old_v = sc_input_dict[key]
                    sc_input_dict[key] = val
                    
                    if key in money_fields:
                        old_num = float(old_v or 0.0)
                        diff_num = float(val) - old_num
                        diff_str = f"{'+' if diff_num >= 0 else ''}₹{diff_num:,.0f} (₹{old_num:,.0f} → ₹{val:,.0f})"
                        base_val_fmt = f"₹{old_num:,.0f}"
                        scen_val_fmt = f"₹{val:,.0f}"
                    elif key in ("dependents_count", "retirement_age", "support_horizon_years"):
                        if old_v is None:
                            diff_str = f"Set to {val}"
                            base_val_fmt = "-"
                        else:
                            diff_num = int(val) - int(old_v)
                            diff_str = f"{'+' if diff_num >= 0 else ''}{diff_num} ({old_v} → {val})"
                            base_val_fmt = old_v
                        scen_val_fmt = val
                    else:
                        diff_str = f"{old_v} → {val}"
                        base_val_fmt = old_v if old_v is not None else "-"
                        scen_val_fmt = val

                    diffs.append(ScenarioDiff(
                        field=key,
                        label=key.replace("_", " ").title(),
                        baseline_value=base_val_fmt,
                        scenario_value=scen_val_fmt,
                        difference_str=diff_str
                    ))
            
            if scenario.description:
                explanation_parts.append(scenario.description)
            else:
                explanation_parts.append("Custom life scenario adjustments applied to baseline parameters.")

        # Re-construct validated scenario input
        scenario_input = AssessmentInput(**sc_input_dict)
        
        # Calculate baseline & scenario results
        baseline_res = FinancialEngine.assess(baseline_input)
        scenario_res = FinancialEngine.assess(scenario_input)
        
        # Financial diffs
        baseline_cover = baseline_res.net_needs.net_coverage_gap
        scenario_cover = scenario_res.net_needs.net_coverage_gap
        cover_diff = round(scenario_cover - baseline_cover, 2)
        
        baseline_prem = cls.calculate_estimated_term_premium(baseline_cover, baseline_input.age, baseline_input.smoker_status)
        scenario_prem = cls.calculate_estimated_term_premium(scenario_cover, scenario_input.age, scenario_input.smoker_status)
        prem_diff = round(scenario_prem - baseline_prem, 2)
        
        explanation = " ".join(explanation_parts) + (
            f" This results in an estimated protection gap shift of {'+' if cover_diff >= 0 else ''}₹{cover_diff:,.0f} "
            f"and an indicative annual term premium shift of {'+' if prem_diff >= 0 else ''}₹{prem_diff:,.0f}."
        )
        
        return ScenarioComparisonResult(
            scenario_id=str(uuid.uuid4()),
            scenario_type=stype,
            title=scenario.title,
            description=scenario.description,
            baseline_result=baseline_res,
            scenario_result=scenario_res,
            diffs=diffs,
            cover_difference=cover_diff,
            estimated_premium_difference=prem_diff,
            explanation=explanation
        )
