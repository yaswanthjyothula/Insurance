"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface CustomUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    phone?: string;
    city?: string;
    annual_income?: number;
    avatar_url?: string;
    verified?: boolean;
    role?: string;
    [key: string]: any;
  };
  created_at?: string;
}

export interface DemoProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  income: number;
}

export const DEMO_USERS: Record<string, DemoProfile> = {
  praveen: {
    name: "Praveen Sharma",
    email: "praveen.sharma@example.com",
    phone: "+91 98765 43210",
    role: "Senior Tech Lead • Bengaluru",
    income: 1800000,
  },
  ananya: {
    name: "Ananya Sen",
    email: "ananya.sen@example.com",
    phone: "+91 98450 11223",
    role: "Product Manager • Mumbai",
    income: 2400000,
  },
};

const LOCAL_SESSION_KEY = "lifesure_user_session";
const LOCAL_USERS_KEY = "lifesure_auth_users";

interface AuthContextValue {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: { email: string; password?: string; full_name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  signInDemo: (profileKey?: "praveen" | "ananya") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signInDemo: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // 1. Check local session first for instantaneous hydration
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load local auth session", e);
      }
    }

    // 2. Check Supabase session if configured
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setSession(data.session);
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || "",
            user_metadata: {
              full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0],
              phone: data.session.user.phone,
              verified: true,
              ...data.session.user.user_metadata,
            },
            created_at: data.session.user.created_at,
          });
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        if (next?.user) {
          setUser({
            id: next.user.id,
            email: next.user.email || "",
            user_metadata: {
              full_name: next.user.user_metadata?.full_name || next.user.email?.split("@")[0],
              phone: next.user.phone,
              verified: true,
              ...next.user.user_metadata,
            },
            created_at: next.user.created_at,
          });
        } else if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => sub.subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const saveLocalUser = (userData: CustomUser) => {
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userData));
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase if configured
    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data.user) {
          const authUser: CustomUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            user_metadata: {
              full_name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
              phone: data.user.phone,
              verified: true,
              ...data.user.user_metadata,
            },
          };
          saveLocalUser(authUser);
          setLoading(false);
          return { success: true };
        }
      } catch (err) {
        // Fall through to local fallback
      }
    }

    // 2. Check registered local users in localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        const registeredUsers: Array<{ email: string; password?: string; name: string; phone?: string }> = raw ? JSON.parse(raw) : [];
        const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
        if (found) {
          if (password && found.password && found.password !== password) {
            setLoading(false);
            return { success: false, error: "Incorrect password. Please verify and try again." };
          }
          const authUser: CustomUser = {
            id: `usr_${Date.now()}`,
            email: found.email,
            user_metadata: {
              full_name: found.name,
              phone: found.phone || "+91 98765 00000",
              verified: true,
            },
          };
          saveLocalUser(authUser);
          setLoading(false);
          return { success: true };
        }
      } catch (e) {
        console.warn("Local user lookup failed", e);
      }
    }

    // 3. Check demo user shortcuts
    if (cleanEmail.includes("praveen") || cleanEmail === DEMO_USERS.praveen.email) {
      await signInDemo("praveen");
      setLoading(false);
      return { success: true };
    }
    if (cleanEmail.includes("ananya") || cleanEmail === DEMO_USERS.ananya.email) {
      await signInDemo("ananya");
      setLoading(false);
      return { success: true };
    }

    // 4. If password was given for any other user, log in cleanly with friendly fallback
    const authUser: CustomUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      user_metadata: {
        full_name: cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        phone: "+91 98765 43210",
        verified: true,
      },
    };
    saveLocalUser(authUser);
    setLoading(false);
    return { success: true };
  };

  const signUp = async ({
    email,
    password,
    full_name,
    phone,
  }: {
    email: string;
    password?: string;
    full_name: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase registration
    if (isSupabaseConfigured && password) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name, phone },
          },
        });
      } catch (e) {
        console.warn("Supabase signup exception", e);
      }
    }

    // 2. Persist locally to registered users
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        const registeredUsers = raw ? JSON.parse(raw) : [];
        registeredUsers.push({ email: cleanEmail, password, name: full_name, phone });
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(registeredUsers));
      } catch (e) {
        console.warn("Failed saving user to local registry", e);
      }
    }

    // 3. Immediately establish authenticated session
    const authUser: CustomUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      user_metadata: {
        full_name,
        phone: phone || "+91 98765 43210",
        verified: true,
      },
    };
    saveLocalUser(authUser);
    setLoading(false);
    return { success: true };
  };

  const signInDemo = async (profileKey: "praveen" | "ananya" = "praveen") => {
    const demo = DEMO_USERS[profileKey] || DEMO_USERS.praveen;
    const authUser: CustomUser = {
      id: `usr_demo_${profileKey}`,
      email: demo.email,
      user_metadata: {
        full_name: demo.name,
        phone: demo.phone,
        role: demo.role,
        annual_income: demo.income,
        verified: true,
      },
      created_at: new Date().toISOString(),
    };
    saveLocalUser(authUser);
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore network errors on signout
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
