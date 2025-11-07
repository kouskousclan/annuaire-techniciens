import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  // Public client (anon key)
  return createClient(supabaseUrl, supabaseAnonKey);
};

const createSupabaseService = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY. Access denied.');
  }
  // Service client (admin key)
  return createClient(supabaseUrl, supabaseServiceKey);
};

export const supabasePublic = getSupabaseClient();
export const supabaseService = createSupabaseService();
// Backward-compatible getter used by existing imports
export const getSupabaseService = createSupabaseService;
