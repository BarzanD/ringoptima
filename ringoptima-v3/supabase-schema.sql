-- ===========================================
-- RINGOPTIMA V3 - SUPABASE DATABASE SCHEMA
-- ===========================================
-- Kör detta SQL i Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ===========================================
-- BATCHES TABLE (Importerade listor)
-- ===========================================
CREATE TABLE IF NOT EXISTS batches (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (för publik app)
CREATE POLICY "Allow anonymous read" ON batches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON batches FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON batches FOR DELETE USING (true);

-- ===========================================
-- CONTACTS TABLE (Kontakter)
-- ===========================================
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  org TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  phones TEXT DEFAULT '',
  users TEXT DEFAULT '',
  operators TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  role TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access
CREATE POLICY "Allow anonymous read" ON contacts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON contacts FOR DELETE USING (true);

-- Index för snabbare sökningar
CREATE INDEX IF NOT EXISTS idx_contacts_batch_id ON contacts(batch_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(priority);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- ===========================================
-- SAVED FILTERS TABLE (Sparade filter)
-- ===========================================
CREATE TABLE IF NOT EXISTS saved_filters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  filter JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access
CREATE POLICY "Allow anonymous read" ON saved_filters FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON saved_filters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON saved_filters FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON saved_filters FOR DELETE USING (true);

-- ===========================================
-- FUNCTION: Auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DONE! 
-- ===========================================
-- Efter att ha kört detta SQL, gå till:
-- 1. Project Settings > API
-- 2. Kopiera "Project URL" och "anon public" key
-- 3. Skapa .env fil med dessa värden
