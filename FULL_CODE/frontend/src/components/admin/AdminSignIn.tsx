"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Gauge, History, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FormAlert } from "@/components/auth/FormAlert";
import { isLoginId } from "@/components/auth/form-validation";
import { safeNextPath } from "@/components/auth/session-helpers";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TextField } from "@/components/auth/TextField";
import { ShieldIcon } from "@/components/brand/Logo";
import { errorMessage } from "@/lib/error-message";

const HOME = "/admin";
const POINTS = [
  { icon: Gauge, text: "Change rates, age limits and underwriting rules live" },
  { icon: History, text: "Every change is versioned and can be rolled back" },
  { icon: ShieldCheck, text: "Administrators only. All changes are recorded" },
];

export function AdminSignIn() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"), HOME);
  const { user, loading, signIn, signInDemoAdmin, signOut } = useAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const destination = next.startsWith(HOME) ? next : HOME;

  useEffect(() => {
    if (!loading && user?.role === "admin") router.replace(destination);
  }, [loading, user, router, destination]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: { id?: string; password?: string } = {};
    if (!/^adm-/i.test(id.trim()) || !isLoginId(id)) found.id = "Enter your administrator ID, like ADM-0001.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const signedIn = await signIn(id.trim(), password);
      if (signedIn.role !== "admin") {
        signOut();
        setFormError("That account is not an administrator account.");
        return;
      }
      router.replace(destination);
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't sign you in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  // Lets a reviewer open the console without Supabase credentials; the server refuses it when ENABLE_DEMO_LOGIN is off
  const openDemo = async () => {
    setBusy(true);
    setFormError(null);
    try {
      await signInDemoAdmin();
      router.replace(destination);
    } catch (error) {
      setFormError(errorMessage(error, "Demo sign-in is not available on this server."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#070B22] p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-[460px] w-[460px] rounded-full bg-[#4F6BFF]/25 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <ShieldIcon className="h-16 w-auto shrink-0 drop-shadow-[0_0_14px_rgba(121,87,255,0.5)]" />
          <span className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight">LifeSure AI</span>
            <span className="block text-xs font-medium text-white/55">Admin console</span>
          </span>
        </div>
        <div className="relative max-w-md space-y-8">
          <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-tight">Change a rule. The next quote already uses it.</h1>
          <ul className="m-0 list-none space-y-4 p-0">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative m-0 text-xs text-white/45">No restart or redeploy is ever needed.</p>
      </aside>
      <main className="flex items-center justify-center bg-[#F8F7FC] px-5 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="m-0 text-2xl font-extrabold tracking-tight text-[#0E1330]">Administrator sign in</h2>
            <p className="m-0 text-sm text-[#6F6A7C]">Use your administrator ID and password.</p>
          </div>
          {loading ? (
            <p role="status" className="m-0 text-sm text-[#6F6A7C]">
              Checking your session…
            </p>
          ) : user && user.role !== "admin" ? (
            <div role="alert" className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="m-0 text-sm font-semibold text-amber-900">You are signed in with a different kind of account.</p>
              <button type="button" onClick={signOut} className="rounded-xl bg-[#0E1330] px-4 py-2 text-sm font-bold text-white">
                Sign out to use an administrator account
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-[#E8E5F0] bg-white p-6">
              <TextField
                id="admin-id"
                label="Administrator ID"
                type="text"
                autoComplete="username"
                placeholder="ADM-0001"
                value={id}
                onChange={setId}
                error={errors.id}
              />
              <TextField
                id="admin-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                error={errors.password}
              />
              <FormAlert message={formError} />
              <SubmitButton busy={busy} idleLabel="Sign in to the admin console" busyLabel="Signing in…" />
              <button
                type="button"
                onClick={openDemo}
                disabled={busy}
                className="w-full rounded-2xl border border-[#D9D3E8] bg-white py-2.5 text-sm font-bold text-[#0E1330] hover:bg-[#F6F4FB] disabled:opacity-60"
              >
                Continue as demo admin (synthetic)
              </button>
            </form>
          )}
          <p className="m-0 text-center text-xs text-[#6F6A7C]">
            <Link href="/sign-in" className="font-bold text-[#7957FF] hover:underline">
              Customer sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
