-- Creates a proper database table for student accounts, replacing the
-- shared JSON file that was causing race-condition data loss.

create table student_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  index_number text not null,
  name text,
  level text,
  linked_at timestamptz default now()
);

-- Matches the same open access level your data already has via the anon key
-- (this is not a security downgrade from your current setup).
alter table student_accounts enable row level security;

create policy "Allow public read" on student_accounts
  for select using (true);

create policy "Allow public insert" on student_accounts
  for insert with check (true);

create policy "Allow public update" on student_accounts
  for update using (true);

create policy "Allow public delete" on student_accounts
  for delete using (true);
