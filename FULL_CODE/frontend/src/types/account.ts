/** The customer's own profile and settings (backend/app/schemas/me.py). */
export type PreferredMode = "video" | "phone" | "chat";

export interface Preferences {
  phone: string | null;
  language: string;
  preferred_mode: PreferredMode | null;
  share_summary_default: boolean;
}

export interface ProfileFacts {
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
  risk_appetite: string;
  smoker: boolean;
}

export interface MyAdvisor {
  advisor_id: string;
  advisor_name: string;
  bio: string;
  languages: string[];
  specialisations: string[];
  consultation_modes: PreferredMode[];
  years_experience: number;
  rating: number;
}

export interface MyProfile {
  name: string;
  login_id: string | null;
  email: string | null;
  profile: ProfileFacts | null;
  advisor: MyAdvisor | null;
  preferences: Preferences;
  password_change_supported: boolean;
}
