import { createClient } from '@supabase/supabase-js';

// SupabaseのURLと公開鍵を環境変数から読み取る
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
