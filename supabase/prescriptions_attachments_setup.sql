alter table if exists public.prescriptions
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_data text,
  add column if not exists file_size bigint;

update public.prescriptions
set id = gen_random_uuid()
where id is null;
