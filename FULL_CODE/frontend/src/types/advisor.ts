/** The advisor API contract (backend/app/schemas/advisor.py). */
export interface AdvisorProfile {
  advisor_id: string;
  advisor_name: string;
  languages: string[];
  specialisations: string[];
  consultation_modes: ConsultationMode[];
  years_experience: number;
  rating: number;
  review_count: number;
  assigned_customers: number;
}

export interface Kpi {
  key: string;
  label: string;
  /** null means the platform does not track this yet. */
  value: number | null;
  note: string | null;
}

export interface AppointmentItem {
  booking_id: string;
  customer_name: string;
  slot_start: string;
  slot_label: string;
  consultation_mode: string;
  simulated: boolean;
}

export interface ActivityItem {
  kind: string;
  summary: string;
  at: string;
  status: string;
}

export type GapBandKey = "covered" | "small" | "moderate" | "large";

export interface GapBand {
  key: GapBandKey;
  label: string;
  count: number;
}

export interface DayLoad {
  date: string;
  label: string;
  count: number;
}

export interface AdvisorDashboard {
  advisor: AdvisorProfile;
  kpis: Kpi[];
  upcoming_appointments: AppointmentItem[];
  recent_activity: ActivityItem[];
  gap_distribution: GapBand[];
  total_protection_gap_inr: number;
  appointment_load: DayLoad[];
  open_slots: number;
  calendar_note: string | null;
}

export type RiskAppetite = "low" | "medium" | "high";
export type CustomerSort = "name" | "age" | "income" | "gap";

export interface CustomerSummary {
  profile_id: string;
  full_name: string;
  age: number;
  city: string;
  occupation: string;
  annual_income_inr: number;
  risk_appetite: string;
  dependents: number;
  gap_band: GapBandKey;
  net_coverage_gap_inr: number;
}

export interface CustomerPage {
  items: CustomerSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CustomerOverview {
  profile_id: string;
  full_name: string;
  age: number;
  gender: string;
  city: string;
  occupation: string;
  employment_type: string;
  marital_status: string;
  annual_income_inr: number;
  dependents: number;
  children: number;
  parents: number;
  spouse_working: boolean | null;
  risk_appetite: string;
  smoker: boolean;
  assigned_advisor_id: string;
  assigned_advisor_name: string;
}

export interface LiabilityLine {
  loan_type: string;
  outstanding_inr: number;
  emi_inr: number | null;
  remaining_months: number | null;
}

export interface GoalLine {
  goal_type: string;
  beneficiary: string;
  amount_today_inr: number;
  target_year: number;
  priority: string;
}

export interface FinancialProfile {
  monthly_income_inr: number;
  monthly_expenses_inr: number;
  individual_cover_inr: number;
  employer_group_cover_inr: number;
  liabilities: LiabilityLine[];
  liquid_savings_inr: number;
  market_investments_inr: number;
  retirement_savings_inr: number;
  eligible_assets_inr: number;
  goals: GoalLine[];
  monthly_premium_budget_inr: number;
}

export interface NeedsBreakdown {
  income_replacement_pv: number;
  future_goals_pv: number;
  outstanding_liabilities: number;
  immediate_expenses: number;
  total_gross_need: number;
  eligible_assets_deducted: number;
  existing_cover_deducted: number;
  net_coverage_gap: number;
  recommended_cover: number;
}

export interface HlvBreakdown {
  hlv_gross: number;
  earning_horizon_years: number;
  personal_consumption_ratio: number;
  wage_growth_rate: number;
  discount_rate: number;
  hlv_net_gap: number;
}

export interface NeedsAnalysis {
  inputs: {
    inflation_rate: number;
    discount_rate: number;
    edu_inflation_rate: number;
    retirement_age: number;
    income_growth_pct: number;
  };
  net_needs: NeedsBreakdown;
  hlv: HlvBreakdown;
  methodology: { method: string; description: string; assumptions_summary: string; limitations: string[] };
  recommendation_summary: string;
}

export interface TimelineEvent {
  kind: string;
  title: string;
  detail: string;
  at: string;
}

export interface CustomerDetail {
  overview: CustomerOverview;
  financial: FinancialProfile;
  analysis: NeedsAnalysis;
  timeline: TimelineEvent[];
}

export type ConsultationMode = "video" | "phone" | "chat";
/** past means the session has started and the advisor has not yet recorded how it went. */
export type AppointmentPhase = "upcoming" | "past" | "completed" | "no_show" | "cancelled";

export interface AppointmentSummary {
  booking_id: string;
  customer_name: string;
  slot_start: string;
  slot_end: string;
  slot_label: string;
  consultation_mode: ConsultationMode;
  status: string;
  phase: AppointmentPhase;
  outcome: "completed" | "no_show" | null;
  outcome_at: string | null;
  starts_in_minutes: number;
  cancelled_by: string;
  message_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  simulated: boolean;
}

export interface AppointmentDetail extends AppointmentSummary {
  customer_phone: string | null;
  meeting_link: string | null;
  customer_note: string | null;
  advisor_notes: string;
  outcome_note: string;
  can_record_outcome: boolean;
  booked_at: string;
  rescheduled: boolean;
}

export interface SlotOption {
  slot_id: string;
  start: string;
  end: string;
  label: string;
}

export type Priority = "low" | "medium" | "high";

export interface FollowUp {
  follow_up_id: string;
  title: string;
  note: string;
  due_date: string;
  priority: Priority;
  status: "open" | "done";
  profile_id: string | null;
  customer_name: string | null;
  booking_id: string | null;
  created_at: string;
  completed_at: string | null;
  overdue: boolean;
  days_until_due: number;
}

export interface AdvisorProfileDetail extends AdvisorProfile {
  bio: string;
}

export interface AdvisorSettings {
  follow_up_default_days: number;
  consultation_modes: ConsultationMode[];
  available_modes: ConsultationMode[];
  password_change_supported: boolean;
}
