import { createClient } from '@supabase/supabase-js';

const isValidUrl = (url) => typeof url === 'string' && /^https?:\/\//.test(url);
const isPlaceholder = (val) => !val || /your_supabase_(project_url|anon_key)/i.test(val);

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = isValidUrl(rawUrl) && !isPlaceholder(rawUrl)
  ? rawUrl
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey && !isPlaceholder(rawKey)
  ? rawKey
  : 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
