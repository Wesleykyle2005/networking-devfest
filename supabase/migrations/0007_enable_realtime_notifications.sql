-- Enable Realtime for notifications table
-- This allows clients to subscribe to INSERT and UPDATE events

-- Enable Realtime replication for notifications table
alter publication supabase_realtime add table notifications;

-- Add comment for documentation
comment on table public.notifications is 
  'Notifications table with Realtime enabled for instant push notifications to clients';
