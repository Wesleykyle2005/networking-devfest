-- Add privacy control for social media links
alter table public.profiles
add column if not exists hide_socials_until_connected boolean not null default true;

-- Add comment for documentation
comment on column public.profiles.hide_socials_until_connected is 
  'When true, social media links (LinkedIn, Twitter, Instagram, Facebook, Website) are only visible to connected users';
