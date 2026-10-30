import type { SessionOut } from "@/types/api";

export interface AuthUser {
  email: string;
  user_metadata: { full_name: string };
  /** True for the synthetic demo customer, so the UI can say so. */
  demo: boolean;
  /** Decided by the server from the signed token. The UI only reads it to pick a landing page; the API enforces it. */
  role: "customer" | "advisor" | "admin";
  advisorId: string | null;
}

export const DEFAULT_NEXT_PATH = "/dashboard";

const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

export function toAuthUser(session: SessionOut): AuthUser {
  return {
    email: session.email,
    user_metadata: { full_name: session.name },
    demo: session.demo,
    role: session.role === "advisor" || session.role === "admin" ? session.role : "customer",
    advisorId: session.advisor_id ?? null,
  };
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

const INTERNAL_DOMAIN = "@users.lifesure.app";

/** Accounts made from the pack sign in with an ID and are stored under an internal address. Show people the ID, not that address. */
export function displayLogin(email: string): string {
  return email.endsWith(INTERNAL_DOMAIN) ? email.slice(0, -INTERNAL_DOMAIN.length).toUpperCase() : email;
}

export const ADVISOR_HOME_PATH = "/advisor";
export const ADVISOR_SIGN_IN_PATH = "/advisor-sign-in";

export function advisorSignInPathFor(pathname: string): string {
  return `${ADVISOR_SIGN_IN_PATH}?next=${encodeURIComponent(pathname)}`;
}

export function signInPathFor(pathname: string): string {
  return `/sign-in?next=${encodeURIComponent(pathname)}`;
}
