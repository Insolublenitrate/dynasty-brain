/**
 * API Configuration helper
 * Automatically resolves the backend API URL across local development and production.
 */
export function getApiUrl(): string {
  // If explicitly configured in environment variables, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // If in browser on localhost, default to local FastAPI server on port 8000
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }

  // Fallback to production hosted backend
  return 'https://dynasty-brain.onrender.com';
}
