-- Seed file for local development
-- This will be automatically run when you reset the database

-- Insert event settings
INSERT INTO public.event_settings (event_id, event_code, event_name, starts_at, ends_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'DEVFEST2025',
  'DevFest Managua 2025',
  '2025-11-15 08:00:00+00',
  '2025-11-15 20:00:00+00'
)
ON CONFLICT (event_id) DO UPDATE 
SET 
  event_code = EXCLUDED.event_code,
  event_name = EXCLUDED.event_name,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at;

-- Sample profiles for testing
-- Note: Profiles require auth.users to exist first due to foreign key
-- For local testing, you'll need to:
-- 1. Sign up via the app (/join with code DEVFEST2025)
-- 2. Or manually insert into auth.users first
-- 3. Then profiles will be created automatically via the app

-- Example: Create auth users and profiles together
-- Uncomment and modify these if you want to seed test users:

/*
DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  user3_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users (simplified - real auth.users has many more fields)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (user1_id, 'test1@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
    (user2_id, 'test2@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
    (user3_id, 'test3@example.com', crypt('password123', gen_salt('bf')), now(), now(), now());

  -- Insert profiles
  INSERT INTO public.profiles (
    id, 
    event_id, 
    slug_uuid, 
    name, 
    headline, 
    company, 
    job_title, 
    bio, 
    location,
    joined_event_at
  ) VALUES
    (
      user1_id,
      '11111111-1111-1111-1111-111111111111',
      gen_random_uuid(),
      'Test User 1',
      'Software Developer',
      'Tech Company',
      'Senior Developer',
      'Passionate about building great products',
      'Managua, Nicaragua',
      now()
    ),
    (
      user2_id,
      '11111111-1111-1111-1111-111111111111',
      gen_random_uuid(),
      'Test User 2',
      'Product Manager',
      'Startup Inc',
      'PM',
      'Love creating user-centric solutions',
      'Managua, Nicaragua',
      now()
    ),
    (
      user3_id,
      '11111111-1111-1111-1111-111111111111',
      gen_random_uuid(),
      'Test User 3',
      'UX Designer',
      'Design Studio',
      'Lead Designer',
      'Design thinking enthusiast',
      'Managua, Nicaragua',
      now()
    );
END $$;
*/

-- Add sample connections between test users
-- Note: You'll need to update these IDs after profiles are created
-- or use a more sophisticated seeding approach

COMMENT ON TABLE public.profiles IS 'Seeded with test data for local development';
