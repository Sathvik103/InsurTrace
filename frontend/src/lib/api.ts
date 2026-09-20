/**
 * VeriSure API Client Configuration
 *
 * Configures the base URL for backend REST calls.
 * In development, defaults to http://localhost:8000.
 * In production / Vercel, defaults to NEXT_PUBLIC_API_URL.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
