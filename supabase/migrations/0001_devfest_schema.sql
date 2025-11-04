-- Enable required extensions -------------------------------------------------
create extension if not exists "pgcrypto" with schema public;
create extension if not exists "pg_trgm" with schema public;

-- Custom types ----------------------------------------------------------------
create type connection_status as enum ('pending', 'approved', 'declined');
create type scan_source as enum ('qr', 'directory', 'link');

-- Helper functions ------------------------------------------------------------
create or replace function public.utc_now()
returns timestamptz
language sql
stable
as $$
  select timezone('utc', now());
$$;

create or replace function public.refresh_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := utc_now();
  return new;
end;
$$;

create or replace function public.normalize_connection_pair()
returns trigger
language plpgsql
as $$
declare
  tmp uuid;
begin
  if new.user_a_id = new.user_b_id then
    raise exception 'Users cannot connect to themselves';
  end if;

  if new.user_a_id > new.user_b_id then
    tmp := new.user_a_id;
    new.user_a_id := new.user_b_id;
    new.user_b_id := tmp;
  end if;

  return new;
end;
$$;

create or replace function public.calculate_profile_completion(
  p_name text,
  p_headline text,
  p_company text,
  p_job_title text,
  p_bio text,
  p_location text,
  p_avatar_url text,
  p_social_linkedin text,
  p_social_twitter text,
  p_social_instagram text,
  p_social_facebook text,
  p_phone text,
  p_email_public text,
  p_website text
) returns integer
language plpgsql
stable
as $$
declare
  checklist integer := 0;
  total integer := 8;
  score numeric := 0;
begin
  -- Required fields
  if coalesce(trim(p_name), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_headline), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_company), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_job_title), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_bio), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_location), '') <> '' then checklist := checklist + 1; end if;
  if coalesce(trim(p_avatar_url), '') <> '' then checklist := checklist + 1; end if;

  -- Bonus: at least one social/contact field
  if coalesce(trim(p_social_linkedin), '') <> ''
     or coalesce(trim(p_social_twitter), '') <> ''
     or coalesce(trim(p_social_instagram), '') <> ''
     or coalesce(trim(p_social_facebook), '') <> ''
     or coalesce(trim(p_phone), '') <> ''
     or coalesce(trim(p_email_public), '') <> ''
     or coalesce(trim(p_website), '') <> '' then
    checklist := checklist + 1;
  end if;

  score := (checklist::numeric / total::numeric) * 100;
  return greatest(0, least(100, round(score)::integer));
end;
$$;

create or replace function public.profiles_before_write()
returns trigger
language plpgsql
as $$
begin
  new.profile_completion_score := calculate_profile_completion(
    new.name,
    new.headline,
    new.company,
    new.job_title,
    new.bio,
    new.location,
    new.avatar_url,
    new.social_linkedin,
    new.social_twitter,
    new.social_instagram,
    new.social_facebook,
    new.phone,
    new.email_public,
    new.website
  );

  if new.created_at is null then
    new.created_at := utc_now();
  end if;

  new.updated_at := utc_now();
  return new;
end;
$$;

-- Core tables -----------------------------------------------------------------
create table public.event_settings (
  event_id uuid primary key,
  event_code text not null,
  event_name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  event_id uuid not null,
  slug_uuid uuid not null default gen_random_uuid() unique,
  name text not null,
  headline text,
  company text,
  job_title text,
  bio text,
  location text,
  avatar_url text,
  social_linkedin text,
  social_twitter text,
  social_instagram text,
  social_facebook text,
  phone text,
  email_public text,
  website text,
  hide_phone_until_connected boolean not null default true,
  hide_email_until_connected boolean not null default true,
  profile_completion_score integer not null default 0,
  joined_event_at timestamptz,
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now()
);

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status connection_status not null default 'pending',
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now(),
  constraint connection_requests_no_self_request check (requester_id <> recipient_id)
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default utc_now(),
  constraint connections_no_self_connection check (user_a_id <> user_b_id)
);

create table public.connection_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  peer_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now()
);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  by_user_id uuid references public.profiles(id) on delete set null,
  source scan_source not null,
  created_at timestamptz not null default utc_now()
);

create table public.qr_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  png_url text not null,
  rendered_at timestamptz not null default utc_now(),
  created_at timestamptz not null default utc_now(),
  updated_at timestamptz not null default utc_now()
);

-- Indexes ---------------------------------------------------------------------
create index idx_profiles_event on public.profiles(event_id);
create index idx_profiles_slug on public.profiles(slug_uuid);
create index idx_profiles_search on public.profiles using gin ((name || ' ' || coalesce(company, '') || ' ' || coalesce(job_title, '')) gin_trgm_ops);

create unique index idx_connection_requests_unique on public.connection_requests (event_id, requester_id, recipient_id);
create index idx_connection_requests_recipient on public.connection_requests (recipient_id, status);

create unique index idx_connections_unique on public.connections (event_id, user_a_id, user_b_id);
create index idx_connections_user_a on public.connections (user_a_id);
create index idx_connections_user_b on public.connections (user_b_id);

create index idx_connection_notes_author on public.connection_notes (author_id, peer_id);
create index idx_scans_profile on public.scans (profile_id, source);
create index idx_qr_assets_profile on public.qr_assets (profile_id);

-- Triggers --------------------------------------------------------------------
create trigger trg_profiles_before_write
before insert or update on public.profiles
for each row execute function public.profiles_before_write();

create trigger trg_connection_requests_updated_at
before update on public.connection_requests
for each row execute function public.refresh_updated_at();

create trigger trg_connections_normalize
before insert on public.connections
for each row execute function public.normalize_connection_pair();

create trigger trg_connection_notes_updated_at
before update on public.connection_notes
for each row execute function public.refresh_updated_at();

create trigger trg_qr_assets_updated_at
before update on public.qr_assets
for each row execute function public.refresh_updated_at();

-- RLS policies ----------------------------------------------------------------
alter table public.event_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.connection_requests enable row level security;
alter table public.connections enable row level security;
alter table public.connection_notes enable row level security;
alter table public.scans enable row level security;
alter table public.qr_assets enable row level security;

-- Event settings readable by service role only; no policies for end users yet.

create policy "Profiles are viewable to all users" on public.profiles
for select using (true);

create policy "Users can manage their profile" on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Insert connection requests as requester" on public.connection_requests
for insert
with check (auth.uid() = requester_id);

create policy "Connection requests visible to participants" on public.connection_requests
for select
using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Recipients can update request status" on public.connection_requests
for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

create policy "Participants can read connections" on public.connections
for select
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Participants can delete their connections" on public.connections
for delete
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "Authors manage their notes" on public.connection_notes
for all
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Authenticated users record scans" on public.scans
for insert
with check (auth.uid() = by_user_id or by_user_id is null);

create policy "Scans visible to profile owners" on public.scans
for select
using (auth.uid() = profile_id or auth.uid() = by_user_id);

create policy "Owners manage QR assets" on public.qr_assets
for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- RPCs -----------------------------------------------------------------------
create or replace function public.rpc_approve_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  normalized_a uuid;
  normalized_b uuid;
begin
  select * into req
  from public.connection_requests
  where id = request_id
  for update;

  if not found then
    raise exception 'Connection request % not found', request_id;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if req.recipient_id <> auth.uid() then
    raise exception 'Only the recipient can approve the request';
  end if;

  normalized_a := least(req.requester_id, req.recipient_id);
  normalized_b := greatest(req.requester_id, req.recipient_id);

  insert into public.connections (event_id, user_a_id, user_b_id)
  values (req.event_id, normalized_a, normalized_b)
  on conflict (event_id, user_a_id, user_b_id) do nothing;

  update public.connection_requests
  set status = 'approved',
      updated_at = utc_now()
  where id = req.id;
end;
$$;

create or replace function public.rpc_profile_completion_score(profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = profile_id;
  if not found then
    raise exception 'Profile % not found', profile_id;
  end if;

  return calculate_profile_completion(
    p.name,
    p.headline,
    p.company,
    p.job_title,
    p.bio,
    p.location,
    p.avatar_url,
    p.social_linkedin,
    p.social_twitter,
    p.social_instagram,
    p.social_facebook,
    p.phone,
    p.email_public,
    p.website
  );
end;
$$;

