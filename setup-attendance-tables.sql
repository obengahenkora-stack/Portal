-- Run ONCE in the Supabase project "obengahenkora-stack's Project"
-- (the one whose address contains mdbhlndjuddymvderuun): SQL Editor > New query > paste > Run.

create table if not exists attendance_sessions (
  session_key text primary key,
  course      text not null,
  date        text not null,
  taken_by    jsonb,
  edited_by   jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists attendance_marks (
  session_key  text not null,
  index_number text not null,
  checked_at   text,
  primary key (session_key, index_number)
);

create table if not exists roster_entries (
  course       text not null,
  index_number text not null,
  name         text default '',
  primary key (course, index_number)
);

create index if not exists attendance_marks_session_idx on attendance_marks (session_key);
create index if not exists attendance_sessions_course_idx on attendance_sessions (course);

alter table attendance_sessions enable row level security;
alter table attendance_marks    enable row level security;
alter table roster_entries      enable row level security;

drop policy if exists "site access" on attendance_sessions;
drop policy if exists "site access" on attendance_marks;
drop policy if exists "site access" on roster_entries;
create policy "site access" on attendance_sessions for all to anon, authenticated using (true) with check (true);
create policy "site access" on attendance_marks    for all to anon, authenticated using (true) with check (true);
create policy "site access" on roster_entries      for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on attendance_sessions, attendance_marks, roster_entries to anon, authenticated;

notify pgrst, 'reload schema';
