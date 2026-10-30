-- LifeSure AI: tables for the advisor and customer data.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run. Safe to run again.
--
-- Access model: only the backend talks to these tables, using the service_role key (which bypasses row-level security).
-- Row-level security is switched on with no policies, and anon/authenticated are revoked, so the public API key can read nothing.

create table if not exists public.advisors (
  advisor_id        text primary key,
  auth_user_id      uuid,
  advisor_name      text not null,
  email             text not null,
  languages         text[] not null default '{}',
  specialisations   text[] not null default '{}',
  consultation_modes text[] not null default '{}',
  years_experience  int  not null default 0,
  rating            numeric(3,1) not null default 0,
  review_count      int  not null default 0,
  working_days      text,
  shift_start       text,
  shift_end         text,
  lunch_break       text
);

create table if not exists public.customers (
  profile_id    text primary key,
  auth_user_id  uuid,
  advisor_id    text references public.advisors (advisor_id),
  full_name     text not null,
  data          jsonb not null            -- the full profile: income, family, loans, goals, cover, preferences
);
create index if not exists customers_advisor_idx on public.customers (advisor_id);

create table if not exists public.advisor_slots (
  slot_id     text primary key,
  advisor_id  text not null references public.advisors (advisor_id),
  slot_start  text not null,              -- local (IST) wall-clock time, as in the pack
  slot_end    text not null,
  status      text not null
);
create index if not exists advisor_slots_advisor_idx on public.advisor_slots (advisor_id, slot_start);

create table if not exists public.bookings (
  booking_id  text primary key,
  advisor_id  text,
  user_email  text,
  status      text not null default 'confirmed',
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists bookings_advisor_idx on public.bookings (advisor_id);
create index if not exists bookings_user_idx on public.bookings (user_email);

create table if not exists public.messages (
  id           bigint generated always as identity primary key,
  booking_id   text not null references public.bookings (booking_id) on delete cascade,
  sender_role  text not null check (sender_role in ('customer', 'advisor', 'system')),
  text         text not null check (char_length(text) between 1 and 1000),
  at           timestamptz not null default now()
);
create index if not exists messages_booking_idx on public.messages (booking_id, id);

create table if not exists public.my_plans (
  user_key    text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.assessments (
  assessment_id text primary key,
  data          jsonb not null,
  saved_at      timestamptz not null default now()
);

create table if not exists public.scenarios (
  scenario_id text primary key,
  data        jsonb not null,
  saved_at    timestamptz not null default now()
);

create table if not exists public.audit_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  actor    text not null,
  action   text not null,
  target   text,
  outcome  text not null default 'ok'
);
create index if not exists audit_log_actor_idx on public.audit_log (actor, at desc);

-- Lock everything down to the backend
do $$
declare t text;
begin
  foreach t in array array['advisors','customers','advisor_slots','bookings','messages','my_plans','assessments','scenarios','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---- Added later: follow-ups and advisor settings (safe to run again) ----

create table if not exists public.follow_ups (
  follow_up_id  text primary key,
  advisor_id    text not null references public.advisors (advisor_id),
  data          jsonb not null,
  created_at    timestamptz not null default now()
);
create index if not exists follow_ups_advisor_idx on public.follow_ups (advisor_id);

create table if not exists public.advisor_settings (
  advisor_id  text primary key references public.advisors (advisor_id),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['follow_ups','advisor_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---- Added later: admin console configuration and analytics events (safe to run again) ----

create table if not exists public.admin_config (
  config_id   text primary key,           -- 'active': the live configuration and its version history
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  kind    text not null,
  actor   text,
  data    jsonb not null default '{}'
);
create index if not exists analytics_events_kind_idx on public.analytics_events (kind, at);

do $$
declare t text;
begin
  foreach t in array array['admin_config','analytics_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---- Added later: CRM leads (safe to run again) ----

create table if not exists public.crm_leads (
  lead_id           text primary key,
  customer_key      text not null unique,   -- the customer's account, or manual:<id> for a lead typed in by hand
  stage             text not null check (stage in ('new','contacted','qualified','proposal','won','lost')),
  owner_advisor_id  text references public.advisors (advisor_id),
  data              jsonb not null,         -- the whole lead: contact, values, notes and stage history
  updated_at        timestamptz not null default now()
);
create index if not exists crm_leads_stage_idx on public.crm_leads (stage);
create index if not exists crm_leads_owner_idx on public.crm_leads (owner_advisor_id);

alter table public.crm_leads enable row level security;
revoke all on public.crm_leads from anon, authenticated;

-- ---- Added later: one confirmed booking per slot, enforced by the database (safe to run again) ----
-- Two customers can press "book" on the same slot at the same moment. The first insert wins; the second is refused here,
-- even if the app is running on more than one server.
create unique index if not exists bookings_one_confirmed_per_slot
  on public.bookings ((data->>'slot_id'))
  where status = 'confirmed';
