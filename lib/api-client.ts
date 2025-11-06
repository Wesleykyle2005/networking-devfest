/**
 * API client helper that handles basePath automatically
 * Use this instead of fetch() for internal API calls
 */

// Get the basePath from Next.js config
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Fetch wrapper that automatically includes basePath
 * @param path - API path (e.g., '/api/notifications')
 * @param options - Fetch options
 */
export async function apiFetch(path: string, options?: RequestInit) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Prepend basePath if in browser (client-side)
  const url = typeof window !== 'undefined' 
    ? `${basePath}${normalizedPath}`
    : normalizedPath;
  
  return fetch(url, options);
}

/**
 * Get the full URL for an API endpoint (useful for debugging)
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return typeof window !== 'undefined'
    ? `${window.location.origin}${basePath}${normalizedPath}`
    : normalizedPath;
}

/**
 * Get the full URL including basePath
 * Use this for OAuth redirects and other absolute URLs
 * @param path - Path (e.g., '/auth/callback')
 */
export function getFullUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${basePath}${normalizedPath}`;
}
