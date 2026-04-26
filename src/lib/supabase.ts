import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database type definitions for type safety
export interface Profile {
  id: string;
  full_name: string | null;
  organization: string | null;
  department: string | null;
  role: string | null;
  created_at: string;
}

export interface UserEquipment {
  id: string;
  user_id: string;
  item_name: string;
  created_at: string;
}

export interface SavedExperiment {
  id: string;
  user_id: string;
  hypothesis: string;
  protocol_data: any;
  budget_total: number | null;
  created_at: string;
}

export interface Correction {
  id: string;
  user_id: string;
  hypothesis: string;
  correction: string;
  created_at: string;
}