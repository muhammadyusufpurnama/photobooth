// src/utils/supabase.js (atau utils/supabase.js)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validasi agar tidak error jika env belum diload
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL dan Key belum di-setting di .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)