export interface Advisor {
  id: string;
  name: string;
  title: string;
  credentials: string;
  experience_years: number;
  specialties: string[];
  available_slots: string[];
  is_fiduciary_aligned: boolean;
  avatar_url?: string;
}

export interface BookingRequest {
  advisor_id: string;
  preferred_slot: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  notes?: string;
  assessment_id?: string;
  share_passport?: boolean;
}

export interface BookingConfirmation {
  booking_id: string;
  advisor_name: string;
  slot: string;
  status: string;
  meeting_link: string;
  calendar_ics_url: string;
  created_at: string;
}
