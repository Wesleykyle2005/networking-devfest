-- Create email tracking table for Resend webhook events
create table if not exists public.email_tracking (
  id uuid primary key default gen_random_uuid(),
  email_id text not null, -- Resend email ID
  event_type text not null, -- sent, delivered, opened, clicked, bounced, etc.
  recipient_email text not null,
  subject text,
  email_category text, -- invitation, connection_request, etc.
  metadata jsonb, -- Store full webhook payload
  created_at timestamp with time zone default now() not null
);

-- Create indexes for common queries
create index email_tracking_email_id_idx on public.email_tracking(email_id);
create index email_tracking_recipient_idx on public.email_tracking(recipient_email);
create index email_tracking_event_type_idx on public.email_tracking(event_type);
create index email_tracking_category_idx on public.email_tracking(email_category);
create index email_tracking_created_at_idx on public.email_tracking(created_at desc);

-- Enable RLS
alter table public.email_tracking enable row level security;

-- Allow service role to insert tracking events (from webhooks)
create policy "Service role can insert tracking events"
  on public.email_tracking
  for insert
  to service_role
  with check (true);

-- Allow service role to view tracking events (for admin panel)
create policy "Service role can view tracking events"
  on public.email_tracking
  for select
  to service_role
  using (true);

-- Add comment
comment on table public.email_tracking is 
  'Stores email tracking events from Resend webhooks for analytics and monitoring';
