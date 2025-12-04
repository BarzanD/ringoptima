import { createClient } from '@supabase/supabase-js';

// Supabase configuration - använd environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using local mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbContact {
  id?: number;
  batch_id: number;
  name: string;
  org: string;
  address: string;
  city: string;
  phones: string;
  users: string;
  operators: string;
  contact: string;
  role: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
  created_at: string;
  updated_at: string;
}

export interface DbBatch {
  id?: number;
  name: string;
  file_name: string;
  count: number;
  created_at: string;
}

export interface DbSavedFilter {
  id?: number;
  name: string;
  filter: Record<string, string>;
  created_at: string;
}
