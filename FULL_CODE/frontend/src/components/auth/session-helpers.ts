import type { SessionOut } from "@/types/api";

export interface AuthUser {
  email: string;
  user_metadata: { full_name: string };
  /** True for the synthetic demo customer, so the UI can say so. */
  demo: boolean;
}

export const DEFAULT_NEXT_PATH = "/dashboard";

const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

export function toAuthUser(session: SessionOut): AuthUser {
  return { email: session.email, user_metadata: { full_name: session.name }, demo: session.demo };
}

/**
 * The `next` query parameter is attacker-controllable, so only same-origin relative paths are followed.
 * Backslashes and control characters are rejected because browsers normalise them into "//host".
 */
export function safeNextPath(raw: string | null | undefined, fallback: string = DEFAULT_NEXT_PATH): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || CONTROL_OR_BACKSLASH.test(raw)) return fallback;
  try {
    return new URL(raw, PLACEHOLDER_ORIGIN).origin === PLACEHOLDER_ORIGIN ? raw : fallback;
  } catch {
    return fallback;
  }
}

export function signInPathFor(pathname: string): string {
  return `/sign-in?next=${encodeURIComponent(pathname)}`;
}
