export const getSupabaseConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
});

export const getEventConfig = () => ({
  id: process.env.NEXT_PUBLIC_EVENT_ID || '',
  name: process.env.NEXT_PUBLIC_EVENT_NAME || 'DevFest Managua 2025',
  code: process.env.NEXT_PUBLIC_EVENT_CODE || '',
});

export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

export const connectionsRequireApproval = () => {
  const raw = process.env.CONNECTIONS_REQUIRE_APPROVAL;
  if (!raw) return false;
  return !['false', '0', 'off', 'no'].includes(raw.toLowerCase());
};

export const log = (level: string, message: string, ...args: unknown[]) => {
  console.log(`[${level.toUpperCase()}]`, message, ...args);
};
