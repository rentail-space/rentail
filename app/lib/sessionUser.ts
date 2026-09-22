/**
 * The subset of the signed-in user the browser needs. Documents are rendered
 * without user state so they stay cacheable at the CDN, so the client fetches
 * this from `/api/session` instead.
 */
export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  isAnonymous: boolean;
}
