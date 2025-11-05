-- Fix pending invitations for users who already have profiles
-- This is a one-time fix for invitations that were sent before the auto-accept logic was added

-- Update invitations to 'accepted' if the user has a profile with the same email
update public.invitations
set 
  status = 'accepted',
  accepted_at = now(),
  updated_at = now()
where 
  status = 'pending'
  and exists (
    select 1 
    from auth.users 
    where users.email = invitations.email
  );

-- Add comment
comment on table public.invitations is 
  'Event invitations with automatic status updates when users join';
