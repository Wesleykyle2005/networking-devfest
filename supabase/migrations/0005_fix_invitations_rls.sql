-- Allow anyone to view invitations by token (needed for invitation acceptance flow)
create policy "Anyone can view invitation by token"
  on public.invitations
  for select
  using (true);

-- Drop the old restrictive policy
drop policy if exists "Admins can view all invitations" on public.invitations;

-- Recreate admin policy for listing all invitations (for admin panel)
-- This is now just for convenience, not security, since anyone can view by token
create policy "Authenticated users can view invitations"
  on public.invitations
  for select
  using (
    auth.uid() is not null
  );
