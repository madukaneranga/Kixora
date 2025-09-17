import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseServiceKey) {
  throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Admin client with service role key - bypasses RLS
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to check if user is admin before using admin client
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// Helper function to execute admin query with automatic admin check
export const executeAdminQuery = async (userId: string | undefined, queryFn: () => Promise<any>) => {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    throw new Error('Access denied: Admin privileges required');
  }

  return await queryFn();
}