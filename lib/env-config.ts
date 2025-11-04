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

export function connectionsRequireApproval(): boolean {
  return process.env.CONNECTIONS_REQUIRE_APPROVAL === "true";
}

export function getAppDomain(): string {
  return process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
}

export const log = (level: string, message: string, ...args: unknown[]) => {
  console.log(`[${level.toUpperCase()}]`, message, ...args);
};
