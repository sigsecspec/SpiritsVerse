-- SpiritsVerse shared Verse auth (Cookbook, StrainVerse, etc.)
-- Run in Supabase SQL Editor. Safe to re-run.
-- Prerequisite: SpiritsVerse schema + profiles table exist (run sql/update.sql first on fresh DB).

-- PART 1: metadata helpers
CREATE OR REPLACE FUNCTION "SpiritsVerse".verse_meta_handle(meta JSONB, user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $verse_handle$
DECLARE
  base_handle TEXT;
BEGIN
  base_handle := lower(regexp_replace(COALESCE(
    meta->>'handle',
    meta->>'username',
    meta->>'user_name',
    meta->>'preferred_username',
    split_part((SELECT email FROM auth.users WHERE id = user_id), '@', 1),
    'user_' || substring(user_id::text from 1 for 8)
  ), '^@', ''));
  base_handle := regexp_replace(base_handle, '\s+', '', 'g');
  IF base_handle = '' THEN
    base_handle := 'user_' || substring(user_id::text from 1 for 8);
  END IF;
  RETURN left(base_handle, 32);
END;
$verse_handle$;

CREATE OR REPLACE FUNCTION "SpiritsVerse".verse_meta_name(meta JSONB, user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $verse_name$
BEGIN
  RETURN COALESCE(
    meta->>'name',
    meta->>'full_name',
    meta->>'display_name',
    split_part((SELECT email FROM auth.users WHERE id = user_id), '@', 1),
    'User'
  );
END;
$verse_name$;

CREATE OR REPLACE FUNCTION "SpiritsVerse".verse_meta_dob(meta JSONB)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $verse_dob$
BEGIN
  RETURN COALESCE(
    NULLIF(meta->>'date_of_birth', '')::DATE,
    NULLIF(meta->>'dob', '')::DATE,
    NULLIF(meta->>'birthday', '')::DATE
  );
END;
$verse_dob$;

-- PART 2: new-user trigger + ensure_my_profile RPC
CREATE OR REPLACE FUNCTION "SpiritsVerse".handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = "SpiritsVerse", public, auth
AS $verse_new_user$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  base_handle := "SpiritsVerse".verse_meta_handle(NEW.raw_user_meta_data, NEW.id);
  new_handle := base_handle;

  WHILE EXISTS (SELECT 1 FROM "SpiritsVerse".profiles WHERE handle = new_handle AND id <> NEW.id) LOOP
    counter := counter + 1;
    new_handle := base_handle || '_' || counter;
  END LOOP;

  INSERT INTO "SpiritsVerse".profiles (id, name, handle, date_of_birth, avatar, bio)
  VALUES (
    NEW.id,
    "SpiritsVerse".verse_meta_name(NEW.raw_user_meta_data, NEW.id),
    new_handle,
    "SpiritsVerse".verse_meta_dob(NEW.raw_user_meta_data),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
    'Just another drink enthusiast.'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$verse_new_user$;

CREATE OR REPLACE FUNCTION "SpiritsVerse".ensure_my_profile()
RETURNS SETOF "SpiritsVerse".profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = "SpiritsVerse", public, auth
AS $verse_ensure_profile$
DECLARE
  uid UUID := auth.uid();
  meta JSONB;
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM "SpiritsVerse".profiles WHERE id = uid) THEN
    RETURN QUERY SELECT * FROM "SpiritsVerse".profiles WHERE id = uid;
    RETURN;
  END IF;

  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = uid;

  base_handle := "SpiritsVerse".verse_meta_handle(meta, uid);
  new_handle := base_handle;

  WHILE EXISTS (SELECT 1 FROM "SpiritsVerse".profiles WHERE handle = new_handle) LOOP
    counter := counter + 1;
    new_handle := base_handle || '_' || counter;
  END LOOP;

  INSERT INTO "SpiritsVerse".profiles (id, name, handle, date_of_birth, avatar, bio)
  VALUES (
    uid,
    "SpiritsVerse".verse_meta_name(meta, uid),
    new_handle,
    "SpiritsVerse".verse_meta_dob(meta),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || uid,
    'Just another drink enthusiast.'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN QUERY SELECT * FROM "SpiritsVerse".profiles WHERE id = uid;
END;
$verse_ensure_profile$;

GRANT EXECUTE ON FUNCTION "SpiritsVerse".ensure_my_profile() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_spiritsverse ON auth.users;
CREATE TRIGGER on_auth_user_created_spiritsverse
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION "SpiritsVerse".handle_new_user();

-- PART 3: backfill existing Verse users
INSERT INTO "SpiritsVerse".profiles (id, name, handle, date_of_birth, avatar, bio)
SELECT
  au.id,
  "SpiritsVerse".verse_meta_name(au.raw_user_meta_data, au.id),
  "SpiritsVerse".verse_meta_handle(au.raw_user_meta_data, au.id) || '_' || substring(au.id::text from 1 for 4),
  "SpiritsVerse".verse_meta_dob(au.raw_user_meta_data),
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || au.id,
  'Just another drink enthusiast.'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM "SpiritsVerse".profiles)
ON CONFLICT (id) DO NOTHING;
