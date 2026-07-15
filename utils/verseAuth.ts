import type { User as SupabaseUser } from '@supabase/supabase-js';

export const SPIRITSVERSE_SCHEMA = 'SpiritsVerse';

export const sanitizeHandle = (raw: string): string =>
  raw.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '').slice(0, 24) || 'user';

export function deriveProfileFromAuthUser(authUser: SupabaseUser) {
  const meta = authUser.user_metadata || {};
  const name =
    meta.name ||
    meta.full_name ||
    meta.display_name ||
    authUser.email?.split('@')[0] ||
    'User';
  const handle = sanitizeHandle(
    meta.handle || meta.username || meta.user_name || meta.preferred_username || name
  );
  const dob = meta.date_of_birth || meta.dob || meta.birthday || undefined;
  return {
    name: String(name).slice(0, 80),
    handle,
    dob: dob ? String(dob) : undefined,
  };
}

/** @deprecated Use deriveProfileFromAuthUser */
export function extractVerseUserMeta(user: SupabaseUser) {
  return deriveProfileFromAuthUser(user);
}

export function isExistingUserError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  );
}

export const VERSE_ACCOUNT_COPY =
  'One Verse account works across Cookbook, StrainVerse, and SpiritsVerse.';

export const EXISTING_VERSE_USER_SIGNUP_MSG =
  'This email is already registered on Cookbook or another Verse app. Sign in with your existing password.';

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. If you signed up on Cookbook or StrainVerse, use the same credentials here.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the verification link.';
  }
  if (isExistingUserError(message)) {
    return EXISTING_VERSE_USER_SIGNUP_MSG;
  }
  if (lower.includes('could not set up your spiritsverse profile')) {
    return message;
  }
  return message;
}
