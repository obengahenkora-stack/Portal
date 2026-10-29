-- Run ONCE in the Supabase project "obengahenkora-stack's Project" (the one that has the student_accounts table)
-- SQL Editor > New query > paste > Run
alter table student_accounts add column if not exists gender text;
alter table student_accounts add column if not exists phone text;
notify pgrst, 'reload schema';
