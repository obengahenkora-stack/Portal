-- Run ONCE in "obengahenkora-stack's Project": SQL Editor > New query > paste > Run.
-- Makes the DATABASE delete chat messages older than 24 hours, every 10 minutes,
-- even when no student is signed in or has the page open.
-- (Run add-chat-table.sql first if you have not already.)

create extension if not exists pg_cron with schema pg_catalog;

-- remove an older copy of this job if it exists, then (re)create it
do $$ begin
  perform cron.unschedule('chat-cleanup');
exception when others then null;
end $$;

select cron.schedule(
  'chat-cleanup',
  '*/10 * * * *',
  $$ delete from public.chat_messages where created_at < now() - interval '24 hours' $$
);

-- check it was created: this should list one row named chat-cleanup
select jobid, jobname, schedule, active from cron.job where jobname = 'chat-cleanup';
