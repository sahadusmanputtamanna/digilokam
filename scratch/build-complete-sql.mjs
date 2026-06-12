// Prepend admin user SQL to existing migration.sql
import { readFileSync, writeFileSync } from 'fs';

const migrationSql = readFileSync('./scratch/migration.sql', 'utf8');

const adminSql = `-- ============================================================
-- DigiLokam Complete Setup SQL
-- STEP 1: Run this entire script in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → RUN
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── STEP 1: Create Admin User in Auth ────────────────────────
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@digilokam.com') THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@digilokam.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","name":"DigiLokam Admin"}',
      false,
      '',
      '',
      '',
      ''
    );

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'admin@digilokam.com'),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Admin user created with ID: %', new_user_id;

    -- Create public.users record
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (new_user_id, 'admin@digilokam.com', 'admin', NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    RAISE NOTICE 'public.users record created';
  ELSE
    -- Get existing user ID and ensure public.users record exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@digilokam.com';
    
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (new_user_id, 'admin@digilokam.com', 'admin', NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    RAISE NOTICE 'Admin user already exists with ID: %', new_user_id;
  END IF;
END $$;

-- Verify admin user
SELECT 'auth.users' AS tbl, id, email FROM auth.users WHERE email = 'admin@digilokam.com'
UNION ALL
SELECT 'public.users' AS tbl, id, email FROM public.users WHERE email = 'admin@digilokam.com';

`;

const fullSql = adminSql + '\n' + migrationSql;
writeFileSync('./scratch/complete-setup.sql', fullSql, 'utf8');
console.log('✅ Generated scratch/complete-setup.sql');
console.log('   File size:', (fullSql.length / 1024).toFixed(1), 'KB');
