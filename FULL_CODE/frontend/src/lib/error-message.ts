import { ApiError } from "@/lib/api";

/** ApiError messages are already written for people; anything else gets the caller's fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}
