import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    // Client public (clé Anon)
    return createClient(supabaseUrl, supabaseKey);
};

export const getSupabaseService = () => {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing SUPABASE_SERVICE_KEY. Access denied.");
    }
    // Client Admin (clé Service)
    return createClient(supabaseUrl, supabaseServiceKey);
};

export const supabasePublic = getSupabaseClient();