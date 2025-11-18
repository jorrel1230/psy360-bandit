import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Get environment variables with safe fallbacks for build/prerender
const supabaseUrl =
	import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
	'https://placeholder.supabase.co';

const supabaseKey =
	import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk3Mzc0ODEsImV4cCI6MTk2NTMxMzQ4MX0.placeholder';

export const supabase = browser
	? createClient(supabaseUrl, supabaseKey)
	: createClient('https://placeholder.supabase.co', 'placeholder');