-- Ringoptima V3 Database Schema
-- Kör detta i din Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id BIGINT REFERENCES batches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  org TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phones TEXT NOT NULL DEFAULT '',
  users TEXT NOT NULL DEFAULT '',
  operators TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  last_called TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_batch_id ON contacts(batch_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(priority);
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON batches(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_contact_id ON call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Batches policies
CREATE POLICY "Users can view their own batches" ON batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batches" ON batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches" ON batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches" ON batches
  FOR DELETE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Call logs policies
CREATE POLICY "Users can view their own call logs" ON call_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs" ON call_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call logs" ON call_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call logs" ON call_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Saved filters policies
CREATE POLICY "Users can view their own saved filters" ON saved_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved filters" ON saved_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters" ON saved_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters" ON saved_filters
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
