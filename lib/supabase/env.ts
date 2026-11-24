export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const authReady = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const dbReady = Boolean(SUPABASE_URL && SUPABASE_SERVICE);
