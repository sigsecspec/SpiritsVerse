import type { User as SupabaseUser } from '@supabase/supabase-js';

/** Metadata keys used across Verse apps (Cookbook, StrainVerse, SpiritsVerse, etc.) */
export function extractVerseUserMeta(user: SupabaseUser) {
  const meta = user.user_metadata || {};
  const emailPrefix = user.email?.split('@')[0] || 'user';

  const name =
    meta.name ||
    meta.full_name ||
    meta.display_name ||
    emailPrefix;

  const rawHandle =
    meta.handle ||
    meta.username ||
    meta.user_name ||
    meta.preferred_username ||
    emailPrefix;

  const handle = String(rawHandle)
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .slice(0, 32) || `user_${user.id.substring(0, 8)}`;

  const dob =
    meta.date_of_birth ||
    meta.dob ||
    meta.birthday ||
    undefined;

  return { name: String(name), handle, dob: dob ? String(dob) : undefined };
}

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. Use the same Verse account you created on Cookbook.io or another Verse app.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the verification link.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'This email already has a Verse account. Sign in instead — your login works across all Verse apps.';
  }
  return message;
}
