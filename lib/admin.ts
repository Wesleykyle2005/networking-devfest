import { getAdminEmails } from "@/lib/env-config";

/**
 * Check if an email is in the admin whitelist
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase());
}

/**
 * Check if a user object has admin access
 */
export function isAdmin(user: { email?: string | null } | null | undefined): boolean {
  return isAdminEmail(user?.email);
}
