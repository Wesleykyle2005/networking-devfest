-- Invitations table
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  email text not null,
  invited_by uuid references public.profiles(id) on delete set null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now(),
  constraint invitations_email_event_unique unique (email, event_id)
);

-- Indexes
create index invitations_token_idx on public.invitations(token);
create index invitations_email_idx on public.invitations(email);
create index invitations_status_idx on public.invitations(status);
create index invitations_event_id_idx on public.invitations(event_id);

-- RLS policies
alter table public.invitations enable row level security;

-- Admin can view all invitations
create policy "Admins can view all invitations"
  on public.invitations
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.event_id = invitations.event_id
    )
  );

-- Admin can insert invitations
create policy "Admins can create invitations"
  on public.invitations
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.event_id = invitations.event_id
    )
  );

-- Trigger to update updated_at
create trigger invitations_updated_at
  before update on public.invitations
  for each row
  execute function public.refresh_updated_at();

-- Function to cleanup expired invitations
create or replace function public.cleanup_expired_invitations()
returns void
language plpgsql
security definer
as $$
begin
  update public.invitations
  set status = 'expired'
  where status = 'pending'
  and expires_at < utc_now();
end;
$$;

-- Grant permissions
grant select, insert, update on public.invitations to authenticated;
