-- OSC Attendance schema. Apply via Supabase SQL editor or psql.
-- Safe to run multiple times: uses `if not exists` where supported.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'volunteer' check (role in ('volunteer', 'admin')),
  default_campus text,
  created_at timestamptz not null default now()
);

create table if not exists counts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  recorded_by uuid references profiles(id) on delete set null,
  campus text not null,
  area text not null,
  service_type text not null,
  service_date date not null,
  multi_angle boolean not null default false,
  photo_count int not null check (photo_count >= 0),
  total_count int not null check (total_count >= 0),
  stage_count int not null default 0 check (stage_count >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  ai_notes text,
  per_image jsonb,
  raw_response jsonb
);

create index if not exists counts_campus_idx on counts (campus);
create index if not exists counts_service_date_idx on counts (service_date desc);
create index if not exists counts_recorded_by_idx on counts (recorded_by);

create table if not exists count_photos (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references counts(id) on delete cascade,
  storage_path text not null,
  image_index int not null check (image_index >= 1),
  uploaded_at timestamptz not null default now(),
  unique (count_id, image_index)
);

create index if not exists count_photos_count_id_idx on count_photos (count_id);

-- After first login, promote a user to admin with:
--   update profiles set role = 'admin' where email = 'someone@oursaviorschurch.org';
