-- Create notifications table for in-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('connection_request', 'connection_accepted')),
  actor_id uuid not null references auth.users(id) on delete cascade,
  reference_id uuid not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(read);
create index notifications_created_at_idx on public.notifications(created_at desc);
create index notifications_user_read_idx on public.notifications(user_id, read);

-- RLS policies
alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- System can insert notifications (via service role)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Users can update their own notifications (mark as read)
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Users can delete their own notifications
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Add comment
comment on table public.notifications is 'In-app notifications for connection requests and acceptances';
