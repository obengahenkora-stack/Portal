-- Run ONCE in the Supabase project "obengahenkora-stack's Project" (the same one you used before)
-- SQL Editor > New query > paste > Run.   This keeps chat history. Chat still works live without it.
create table if not exists chat_messages (
  id         text primary key,
  room       text not null,
  from_id    text not null,
  from_name  text,
  text       text not null,
  created_at timestamptz default now()
);
create index if not exists chat_messages_room_idx on chat_messages (room, created_at desc);

alter table chat_messages enable row level security;
drop policy if exists "chat access" on chat_messages;
create policy "chat access" on chat_messages for all to anon, authenticated using (true) with check (true);
grant select, insert, delete on chat_messages to anon, authenticated;
notify pgrst, 'reload schema';

-- To delete chats older than 24 hours on a timer, even when nobody is signed in, also run chat-auto-delete.sql.
