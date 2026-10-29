"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "signin" | "signup" | "reset";

function nextPath() {
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export default function SignInPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath());
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (data.session) router.push(nextPath());
        else setNotice("Account created. Check your email to confirm it, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/sign-in` });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D9D3E8] bg-white text-[#24212B] focus:border-[#7957FF]";
  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const cta = mode === "signin" ? "Sign In to Dashboard" : mode === "signup" ? "Create Account" : "Send Reset Link";

  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-[#D9D3E8] rounded-[28px] p-10 shadow-[0_40px_90px_rgba(121,87,255,0.13)] space-y-5 text-center">
          <Logo className="justify-center" />
          <p className="text-sm text-[#4A4553]">Signed in as <strong>{user.email}</strong></p>
          <Link href="/dashboard" className="block w-full py-3 text-sm font-semibold text-white bg-[#7957FF] rounded-xl">Go to Dashboard</Link>
          <button onClick={signOut} className="w-full py-3 text-sm font-semibold border border-[#D9D3E8] rounded-xl">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#D9D3E8] rounded-[28px] p-8 sm:p-10 shadow-[0_40px_90px_rgba(121,87,255,0.13)] space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-2" />
          <h1 className="text-2xl font-extrabold text-[#24212B]">{title}</h1>
          <p className="text-xs text-[#6F6A7C]">Sign in to access your Protection Passport and saved scenarios.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 rounded-xl bg-[#FFFBEB] text-[11px] text-[#D97706] border border-[#D97706]/30">
            Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "signup" && (
            <div>
              <label className="font-semibold block mb-1 text-[#24212B]" htmlFor="name">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1 text-[#24212B]" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <div className="flex justify-between items-center mb-1 font-semibold text-[#24212B]">
                <label htmlFor="password">Password</label>
                {mode === "signin" && (
                  <button type="button" onClick={() => { setMode("reset"); setError(null); setNotice(null); }} className="text-[#7957FF] text-[11px] hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
              </div>
            </div>
          )}

          {error && <div role="alert" className="p-3 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20">{error}</div>}
          {notice && <div role="status" className="p-3 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20">{notice}</div>}

          <button type="submit" disabled={loading || !isSupabaseConfigured} className="w-full py-3 text-xs font-semibold text-white bg-[#7957FF] hover:brightness-110 disabled:opacity-60 rounded-xl shadow-[0_10px_30px_rgba(121,87,255,0.25)] transition flex items-center justify-center gap-2">
            <span>{loading ? "Please wait…" : cta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#4A4553] space-y-2">
          {mode === "signin" && <p>New here? <button onClick={() => { setMode("signup"); setError(null); setNotice(null); }} className="font-bold text-[#7957FF] hover:underline">Create an account</button></p>}
          {mode !== "signin" && <p>Already registered? <button onClick={() => { setMode("signin"); setError(null); setNotice(null); }} className="font-bold text-[#7957FF] hover:underline">Sign in</button></p>}
          <p><Link href="/tools/life-cover-calculator" className="font-bold text-[#7957FF] hover:underline">Calculate your cover first →</Link></p>
        </div>
      </div>
    </div>
  );
}
