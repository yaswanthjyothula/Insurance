"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, fetchFromAPI, getToken, postJSON, setToken } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { clearStoredSession } from "@/store/assessment-store";
import type { SessionOut } from "@/types/api";
import { toAuthUser, type AuthUser } from "@/components/auth/session-helpers";

export interface RegisterDetails {
  full_name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the stored session (if any) has been checked with the server. */
  loading: boolean;
  /** Set when a stored session could not be checked because the server was unreachable. */
  sessionError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (details: RegisterDetails) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored token is only readable after mount
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchFromAPI<SessionOut>("/auth/me")
      .then((session) => !cancelled && setUser(toAuthUser(session)))
      .catch((error: unknown) => {
        if (cancelled) return;
        // An expired token is dropped; an unreachable server keeps it so a reload can recover the session.
        if (error instanceof ApiError && error.status === 401) setToken(null);
        else setSessionError(errorMessage(error, "We couldn't restore your session."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback((session: SessionOut) => {
    setToken(session.token);
    setSessionError(null);
    setUser(toAuthUser(session));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => startSession(await postJSON<SessionOut>("/auth/login", { email, password })),
    [startSession],
  );
  const signUp = useCallback(
    async (details: RegisterDetails) => startSession(await postJSON<SessionOut>("/auth/register", details)),
    [startSession],
  );
  const signInDemo = useCallback(async () => startSession(await postJSON<SessionOut>("/auth/demo", {})), [startSession]);
  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    clearStoredSession(); // the next person on this browser must not see this journey
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, signIn, signUp, signInDemo, signOut }),
    [user, loading, sessionError, signIn, signUp, signInDemo, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
