-- Allow authenticated users to update invitations
-- This is needed for the join flow to mark invitations as accepted

create policy "Authenticated users can update invitations"
  on public.invitations
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Add comment
comment on table public.invitations is 
  'Event invitations with RLS policies allowing authenticated users to update status';
