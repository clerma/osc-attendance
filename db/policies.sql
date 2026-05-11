-- Row Level Security policies for OSC Attendance.
-- Apply after schema.sql.

-- ---------- profiles ----------
alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_select_admin on profiles;
create policy profiles_select_admin on profiles
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Prevent non-admins from elevating their own role.
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if new.role is distinct from old.role then
    select role into caller_role from profiles where id = auth.uid();
    if caller_role is distinct from 'admin' then
      new.role := old.role;
    end if;
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
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.default_campus = counts.campus)
    )
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
      join profiles p on p.id = auth.uid()
      where c.id = count_photos.count_id
        and (p.role = 'admin' or p.default_campus = c.campus)
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
      or exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );
