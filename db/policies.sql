-- Row Level Security policies for OSC Attendance.
-- Apply after schema.sql. Safe to re-run.

-- ---------- helpers ----------
-- SECURITY DEFINER lookups so policies on `profiles` don't reference
-- `profiles` and recurse.
create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'admin' from profiles where id = uid), false);
$$;

create or replace function user_default_campus(uid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select default_campus from profiles where id = uid;
$$;

-- ---------- profiles ----------
alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_select_admin on profiles;
create policy profiles_select_admin on profiles
  for select using (is_admin(auth.uid()));

drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update using (is_admin(auth.uid()));

-- Prevent non-admins from elevating their own role.
-- auth.uid() is null when the update comes from the SQL editor / service
-- role / postgres role; in those cases we allow the change (server-side
-- admin work). Only volunteer-level callers are blocked.
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and auth.uid() is not null
    and not is_admin(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on profiles;
create trigger profiles_prevent_role_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- ---------- counts ----------
alter table counts enable row level security;

drop policy if exists counts_insert_own on counts;
create policy counts_insert_own on counts
  for insert with check (auth.uid() = recorded_by);

drop policy if exists counts_select_same_campus on counts;
create policy counts_select_same_campus on counts
  for select using (
    is_admin(auth.uid())
    or user_default_campus(auth.uid()) = counts.campus
  );

-- No update / delete policies: counts are an immutable audit trail.

-- ---------- count_photos ----------
alter table count_photos enable row level security;

drop policy if exists count_photos_insert_own on count_photos;
create policy count_photos_insert_own on count_photos
  for insert with check (
    exists (
      select 1 from counts c
      where c.id = count_photos.count_id and c.recorded_by = auth.uid()
    )
  );

drop policy if exists count_photos_select_via_count on count_photos;
create policy count_photos_select_via_count on count_photos
  for select using (
    exists (
      select 1 from counts c
      where c.id = count_photos.count_id
        and (
          is_admin(auth.uid())
          or user_default_campus(auth.uid()) = c.campus
        )
    )
  );

-- ---------- storage ----------
-- Run these via the Supabase dashboard (Storage > New bucket) or SQL:
--   insert into storage.buckets (id, name, public) values ('attendance-photos', 'attendance-photos', false)
--   on conflict (id) do nothing;

-- Storage policies on the `attendance-photos` bucket.
-- Volunteers may upload to a prefix matching their user id. Admins may read all.
drop policy if exists storage_attendance_insert on storage.objects;
create policy storage_attendance_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_attendance_select on storage.objects;
create policy storage_attendance_select on storage.objects
  for select to authenticated using (
    bucket_id = 'attendance-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin(auth.uid())
    )
  );
