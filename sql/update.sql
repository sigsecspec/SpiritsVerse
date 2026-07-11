-- SpiritsVerse schema setup for the shared Verse Supabase project.
-- Idempotent: safe to run on the shared DB when the schema may already exist.
-- For a full reset, use sql.txt (includes DROP SCHEMA) on a fresh database only.

CREATE SCHEMA IF NOT EXISTS "SpiritsVerse";

-- GRANT PERMISSIONS (Fix for "permission denied for schema" errors)
GRANT USAGE ON SCHEMA "SpiritsVerse" TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "SpiritsVerse" GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "SpiritsVerse" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS "SpiritsVerse".profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    city TEXT,
    state TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    distance_radius FLOAT8 DEFAULT 25,
    fav_drinks JSONB DEFAULT '[]'::JSONB,
    drinking_style TEXT,
    badges JSONB DEFAULT '[]'::JSONB,
    widgets JSONB DEFAULT '[]'::JSONB,
    custom_css TEXT,
    custom_js TEXT,
    date_of_birth DATE,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'User',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_handle UNIQUE (handle)
);

-- 2. SPIRITS (Drink Directory)
CREATE TABLE IF NOT EXISTS "SpiritsVerse".spirits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    abv FLOAT,
    age INT,
    region TEXT,
    tasting_notes JSONB DEFAULT '[]'::JSONB,
    pairs_with JSONB DEFAULT '[]'::JSONB,
    maker TEXT,
    history TEXT,
    recipe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POSTS (SipStream & PourUp)
CREATE TABLE IF NOT EXISTS "SpiritsVerse".posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    visibility TEXT NOT NULL,
    latitude FLOAT8,
    longitude FLOAT8,
    comments INT DEFAULT 0,
    spirit TEXT,
    buzz_level INT DEFAULT 0,
    venue TEXT,
    mood TEXT,
    badges JSONB DEFAULT '[]'::JSONB,
    is_toastit BOOLEAN DEFAULT FALSE,
    toast_looking_for TEXT,
    toast_expires_at TIMESTAMPTZ,
    group_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INTERACTIONS & REACTIONS
CREATE TABLE IF NOT EXISTS "SpiritsVerse".post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES "SpiritsVerse".posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES "SpiritsVerse".posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOCIAL GROUPS (BarSesh)
CREATE TABLE IF NOT EXISTS "SpiritsVerse".groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    members JSONB DEFAULT '[]'::JSONB,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id TEXT REFERENCES "SpiritsVerse".groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SPIRIT SOCIAL (Photos, Reviews, Logs)
CREATE TABLE IF NOT EXISTS "SpiritsVerse".spirit_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spirit_id UUID REFERENCES "SpiritsVerse".spirits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    serving_style TEXT DEFAULT 'BAR',
    cocktail_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".spirit_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spirit_id UUID REFERENCES "SpiritsVerse".spirits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    serving_style TEXT DEFAULT 'BAR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, spirit_id, serving_style)
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".spirit_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spirit_id UUID REFERENCES "SpiritsVerse".spirits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".user_spirit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    spirit_id UUID REFERENCES "SpiritsVerse".spirits(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, spirit_id)
);

-- 7. STORIES
CREATE TABLE IF NOT EXISTS "SpiritsVerse".stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    spirit_name TEXT,
    buzz_level INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RELATIONSHIPS & BLOCKS
CREATE TABLE IF NOT EXISTS "SpiritsVerse".relationships (
    user_1_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    user_2_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (user_1_id, user_2_id)
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".blocks (
    blocker_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES "SpiritsVerse".posts(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POURUP INTERACTIONS
CREATE TABLE IF NOT EXISTS "SpiritsVerse".toastit_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES "SpiritsVerse".posts(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES "SpiritsVerse".profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    type TEXT NOT NULL CHECK (type IN ('RAISE_GLASS', 'CLINK')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TOASTED', 'DECLINED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    group_id TEXT REFERENCES "SpiritsVerse".groups(id) ON DELETE SET NULL,
    UNIQUE (post_id, sender_id)
);

CREATE TABLE IF NOT EXISTS "SpiritsVerse".safety_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references "SpiritsVerse".profiles(id) on delete cascade not null,
  latitude float not null,
  longitude float not null,
  status text not null,
  created_at timestamptz default now()
);

-- VIEWS
CREATE OR REPLACE VIEW "SpiritsVerse".spirits_with_stats AS
SELECT
  s.*,
  (SELECT count(*) FROM "SpiritsVerse".spirit_photos sp WHERE sp.spirit_id = s.id) AS photo_count,
  (SELECT count(*) FROM "SpiritsVerse".spirit_reviews sr WHERE sr.spirit_id = s.id) AS review_count,
  (SELECT avg(sr.rating) FROM "SpiritsVerse".spirit_reviews sr WHERE sr.spirit_id = s.id) AS avg_rating,
  (SELECT sp.image_url FROM "SpiritsVerse".spirit_photos sp WHERE sp.spirit_id = s.id ORDER BY sp.created_at DESC LIMIT 1) AS cover_image_url
FROM
  "SpiritsVerse".spirits s;

-- SEED DATA
INSERT INTO "SpiritsVerse".spirits (name, category, description, abv, age, region, tasting_notes, maker, history, recipe) VALUES
('Old Fashioned', 'Cocktail', 'The definition of a cocktail: spirits, sugar, water, and bitters.', 32, 0, 'Global', '["citrus", "oak", "sweet"]', 'Classic', 'Originated in the 19th century.', '2 oz Whiskey, 1 Sugar Cube, Angostura Bitters.'),
('Macallan 12', 'Whiskey', 'Sherry oak single malt.', 40, 12, 'Speyside, Scotland', '["dried fruit", "ginger", "wood smoke"]', 'The Macallan', null, null),
('Margarita', 'Cocktail', 'A classic tequila sour.', 26, 0, 'Mexico', '["lime", "salt", "agave"]', 'Classic', null, '2 oz Tequila, 1 oz Lime, 0.5 oz Orange Liqueur'),
('Guinness Draught', 'Beer', 'Iconic Irish dry stout.', 4.2, 0, 'Dublin, Ireland', '["coffee", "chocolate", "malt"]', 'Guinness', 'Brewed at St. James Gate since 1759.', null),
('Hendrick''s Gin', 'Gin', 'Infused with cucumber and rose.', 41.4, 0, 'Scotland', '["cucumber", "floral", "citrus"]', 'William Grant', null, null),
('Negroni', 'Cocktail', 'A popular Italian cocktail.', 24, 0, 'Florence, Italy', '["bitter", "sweet", "herbal"]', 'Classic', 'Invented in 1919 by Count Camillo Negroni.', '1 oz Gin, 1 oz Campari, 1 oz Sweet Vermouth'),
('Aperol Spritz', 'Cocktail', 'Refreshing Italian wine-based cocktail.', 11, 0, 'Venice, Italy', '["orange", "bubbly", "refreshing"]', 'Classic', 'Became popular in the 1950s.', '3 parts Prosecco, 2 parts Aperol, 1 part Soda Water')
ON CONFLICT (name) DO NOTHING;

-- ENABLE RLS
ALTER TABLE "SpiritsVerse".profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".spirits ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".spirit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".spirit_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".spirit_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".user_spirit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpiritsVerse".toastit_interactions ENABLE ROW LEVEL SECURITY;

-- POLICIES (idempotent)
DROP POLICY IF EXISTS "Public read profiles" ON "SpiritsVerse".profiles;
CREATE POLICY "Public read profiles" ON "SpiritsVerse".profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON "SpiritsVerse".profiles;
CREATE POLICY "Users update own profile" ON "SpiritsVerse".profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert own profile" ON "SpiritsVerse".profiles;
CREATE POLICY "Users insert own profile" ON "SpiritsVerse".profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public read posts" ON "SpiritsVerse".posts;
CREATE POLICY "Public read posts" ON "SpiritsVerse".posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create posts" ON "SpiritsVerse".posts;
CREATE POLICY "Users create posts" ON "SpiritsVerse".posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read spirits" ON "SpiritsVerse".spirits;
CREATE POLICY "Public read spirits" ON "SpiritsVerse".spirits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth all" ON "SpiritsVerse".post_reactions;
CREATE POLICY "Auth all" ON "SpiritsVerse".post_reactions FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all comments" ON "SpiritsVerse".post_comments;
CREATE POLICY "Auth all comments" ON "SpiritsVerse".post_comments FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all groups" ON "SpiritsVerse".groups;
CREATE POLICY "Auth all groups" ON "SpiritsVerse".groups FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all messages" ON "SpiritsVerse".messages;
CREATE POLICY "Auth all messages" ON "SpiritsVerse".messages FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all photos" ON "SpiritsVerse".spirit_photos;
CREATE POLICY "Auth all photos" ON "SpiritsVerse".spirit_photos FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all reviews" ON "SpiritsVerse".spirit_reviews;
CREATE POLICY "Auth all reviews" ON "SpiritsVerse".spirit_reviews FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all spirit chat" ON "SpiritsVerse".spirit_chat_messages;
CREATE POLICY "Auth all spirit chat" ON "SpiritsVerse".spirit_chat_messages FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all logs" ON "SpiritsVerse".user_spirit_log;
CREATE POLICY "Auth all logs" ON "SpiritsVerse".user_spirit_log FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all stories" ON "SpiritsVerse".stories;
CREATE POLICY "Auth all stories" ON "SpiritsVerse".stories FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all interactions" ON "SpiritsVerse".toastit_interactions;
CREATE POLICY "Auth all interactions" ON "SpiritsVerse".toastit_interactions FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all relationships" ON "SpiritsVerse".relationships;
CREATE POLICY "Auth all relationships" ON "SpiritsVerse".relationships FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all blocks" ON "SpiritsVerse".blocks;
CREATE POLICY "Auth all blocks" ON "SpiritsVerse".blocks FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth all reports" ON "SpiritsVerse".reports;
CREATE POLICY "Auth all reports" ON "SpiritsVerse".reports FOR ALL USING (auth.role() = 'authenticated');

-- REALTIME (skip if already published)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'SpiritsVerse' AND tablename = 'spirits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "SpiritsVerse".spirits;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'SpiritsVerse' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "SpiritsVerse".posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'SpiritsVerse' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "SpiritsVerse".messages;
  END IF;
END $$;

-- 10. AUTOMATION & TRIGGERS (Pull Profiles from Auth)
CREATE OR REPLACE FUNCTION "SpiritsVerse".handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  base_handle := COALESCE(NEW.raw_user_meta_data->>'handle', 'user_' || substring(NEW.id::text from 1 for 8));
  new_handle := base_handle;

  WHILE EXISTS (SELECT 1 FROM "SpiritsVerse".profiles WHERE handle = new_handle AND id <> NEW.id) LOOP
    counter := counter + 1;
    new_handle := base_handle || '_' || counter;
  END LOOP;

  INSERT INTO "SpiritsVerse".profiles (id, name, handle, date_of_birth, avatar, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    new_handle,
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
    'Just another drink enthusiast.'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    handle = EXCLUDED.handle;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- App-specific trigger name (shared auth.users across Verse apps)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_spiritsverse ON auth.users;
CREATE TRIGGER on_auth_user_created_spiritsverse
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION "SpiritsVerse".handle_new_user();

-- Backfill existing users
INSERT INTO "SpiritsVerse".profiles (id, name, handle, date_of_birth, avatar, bio)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', 'User'),
  COALESCE(raw_user_meta_data->>'handle', 'user_' || substring(id::text from 1 for 8)),
  (raw_user_meta_data->>'date_of_birth')::DATE,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id,
  'Just another drink enthusiast.'
FROM auth.users
WHERE id NOT IN (SELECT id FROM "SpiritsVerse".profiles)
ON CONFLICT (id) DO NOTHING;

-- 11. FINAL PERMISSIONS
GRANT USAGE ON SCHEMA "SpiritsVerse" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "SpiritsVerse" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "SpiritsVerse" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "SpiritsVerse" TO anon, authenticated, service_role;

-- Register schema with shared Verse Supabase project
SELECT register_app_schema('SpiritsVerse');
