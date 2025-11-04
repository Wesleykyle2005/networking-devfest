-- Export production data for local seeding
-- Run this in your production Supabase SQL Editor, then copy the results

-- Export event_settings
SELECT 'INSERT INTO public.event_settings (event_id, event_code, event_name, starts_at, ends_at) VALUES ' ||
  string_agg(
    format('(%L, %L, %L, %L, %L)', 
      event_id, event_code, event_name, starts_at, ends_at
    ), 
    ', '
  ) || ' ON CONFLICT (event_id) DO UPDATE SET event_code = EXCLUDED.event_code, event_name = EXCLUDED.event_name;'
FROM public.event_settings;

-- Export profiles (anonymized emails/phones for privacy)
SELECT 'INSERT INTO public.profiles (id, event_id, slug_uuid, name, headline, company, job_title, bio, location, social_linkedin, social_twitter, social_instagram, social_facebook, phone, email_public, website, hide_phone_until_connected, hide_email_until_connected, avatar_url, completion_score, joined_event_at) VALUES ' ||
  string_agg(
    format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)', 
      id, event_id, slug_uuid, name, headline, company, job_title, bio, location, 
      social_linkedin, social_twitter, social_instagram, social_facebook,
      CASE WHEN phone IS NOT NULL THEN '+505-XXXX-XXXX' ELSE NULL END,  -- Anonymize
      CASE WHEN email_public IS NOT NULL THEN 'user' || (ROW_NUMBER() OVER ())::text || '@example.com' ELSE NULL END,  -- Anonymize
      website, hide_phone_until_connected, hide_email_until_connected, avatar_url, completion_score, joined_event_at
    ), 
    ', '
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.profiles
LIMIT 50;  -- Limit for testing, remove for full export

-- Export connections
SELECT 'INSERT INTO public.connections (id, event_id, user_a_id, user_b_id, created_at) VALUES ' ||
  string_agg(
    format('(%L, %L, %L, %L, %L)', 
      id, event_id, user_a_id, user_b_id, created_at
    ), 
    ', '
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.connections
LIMIT 100;  -- Limit for testing

-- Export connection_requests
SELECT 'INSERT INTO public.connection_requests (id, event_id, requester_id, recipient_id, status, created_at) VALUES ' ||
  string_agg(
    format('(%L, %L, %L, %L, %L, %L)', 
      id, event_id, requester_id, recipient_id, status, created_at
    ), 
    ', '
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.connection_requests
LIMIT 50;

-- Export scans
SELECT 'INSERT INTO public.scans (id, event_id, scanner_id, profile_id, source, created_at) VALUES ' ||
  string_agg(
    format('(%L, %L, %L, %L, %L, %L)', 
      id, event_id, scanner_id, profile_id, source, created_at
    ), 
    ', '
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.scans
LIMIT 100;
