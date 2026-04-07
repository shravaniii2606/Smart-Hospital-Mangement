-- HealthSphere ambulance request setup
-- Run this in the Supabase SQL Editor for the project that backs this app.

begin;

alter table public.ambulance_requests
add column if not exists patient_name text null,
add column if not exists pickup_location text null,
add column if not exists emergency_note text null,
add column if not exists estimated_time text null,
add column if not exists response_note text null,
add column if not exists reviewed_at timestamp with time zone null,
add column if not exists verified_patient boolean not null default false,
add column if not exists latitude double precision null,
add column if not exists longitude double precision null;

alter table public.ambulance_requests enable row level security;

drop policy if exists "Patients can insert their own ambulance requests" on public.ambulance_requests;
create policy "Patients can insert their own ambulance requests"
on public.ambulance_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Patients can view their own ambulance requests" on public.ambulance_requests;
create policy "Patients can view their own ambulance requests"
on public.ambulance_requests
for select
to authenticated
using (auth.uid() = user_id);

-- Demo-friendly hospital console policies for the current static frontend.
-- These allow the hospital dashboard page to read and update requests.
-- Tighten these before production.
drop policy if exists "Hospital dashboard can read ambulance requests" on public.ambulance_requests;
create policy "Hospital dashboard can read ambulance requests"
on public.ambulance_requests
for select
to anon, authenticated
using (true);

drop policy if exists "Hospital dashboard can update ambulance requests" on public.ambulance_requests;
create policy "Hospital dashboard can update ambulance requests"
on public.ambulance_requests
for update
to anon, authenticated
using (true)
with check (true);

commit;
