alter table if exists public.prescriptions
  add column if not exists bed_required boolean not null default false;
