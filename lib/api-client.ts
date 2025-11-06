/**
 * API client helper that handles basePath automatically
 * Use this instead of fetch() for internal API calls
 */

// Base path configured via environment (injected at build time by Next.js)
const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function resolveBasePath(): string {
  if (typeof window === 'undefined') {
    return envBasePath;
  }

  if (envBasePath) {
    return envBasePath;
  }

  type NextWindow = Window & { __NEXT_DATA__?: { config?: { basePath?: string } } };
  const nextData = (window as NextWindow).__NEXT_DATA__;
  if (nextData?.config?.basePath) {
    return nextData.config.basePath;
  }

  const baseTag = document.querySelector('base');
  const href = baseTag?.getAttribute('href');
  if (href && href.startsWith('/')) {
    return href.endsWith('/') ? href.slice(0, -1) : href;
  }

  return '';
}

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
    ? `${resolveBasePath()}${normalizedPath}`
    : normalizedPath;
  
  return fetch(url, options);
}

/**
 * Get the full URL for an API endpoint (useful for debugging)
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return typeof window !== 'undefined'
    ? `${window.location.origin}${resolveBasePath()}${normalizedPath}`
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
  return `${window.location.origin}${resolveBasePath()}${normalizedPath}`;
}
