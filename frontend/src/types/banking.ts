export interface BankProfile {
  id: string;
  bank_name: string;
  bank_code: "HDFC" | "ICICI" | "SBI" | "AXIS" | string;
  account_type: string;
  masked_account: string;
  holder_name: string;
  kyc_status: string;
  cibil_score: number;
  monthly_salary_credit: number;
  annual_income: number;
  monthly_expenses_inferred: number;
  annual_expenses: number;
  age: number;
  employment_type: string;
  dependents_count: number;
  active_home_loan_balance: number;
  active_other_loans_balance: number;
  liquid_savings_balance: number;
  existing_term_cover: number;
  support_horizon_years: number;
  buffer_months: number;
  retirement_age: number;
  smoker_status: "yes" | "no";
  future_goals: Array<{
    type: string;
    name: string;
    cost: string;
    years: string;
  }>;
  verification_badge: string;
  consent_statement: string;
}
