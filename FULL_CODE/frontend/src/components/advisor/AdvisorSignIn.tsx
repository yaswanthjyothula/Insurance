"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck2, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FormAlert } from "@/components/auth/FormAlert";
import { isLoginId } from "@/components/auth/form-validation";
import { ADVISOR_HOME_PATH, safeNextPath } from "@/components/auth/session-helpers";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { TextField } from "@/components/auth/TextField";
import { ShieldIcon } from "@/components/brand/Logo";
import { errorMessage } from "@/lib/error-message";

const POINTS = [
  { icon: Users, text: "Your customers and where their cover falls short" },
  { icon: CalendarCheck2, text: "Consultations, rescheduling and notes in one calendar" },
  { icon: MessageSquare, text: "Chat with customers before and after each session" },
];

export function AdvisorSignIn() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"), ADVISOR_HOME_PATH);
  const { user, loading, signIn, signOut } = useAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A next page outside the advisor area would be the customer site, so it is ignored here
  const destination = next.startsWith(ADVISOR_HOME_PATH) ? next : ADVISOR_HOME_PATH;

  useEffect(() => {
    if (!loading && user?.role === "advisor") router.replace(destination);
  }, [loading, user, router, destination]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: { id?: string; password?: string } = {};
    if (!/^adv-/i.test(id.trim()) || !isLoginId(id)) found.id = "Enter your advisor ID, like ADV-4KKBRK.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const signedIn = await signIn(id.trim(), password);
      if (signedIn.role !== "advisor") {
        // The credentials were right but this is not an advisor account: do not leave a customer session behind
        signOut();
        setFormError("That account is not an advisor account. Customers sign in on the main sign-in page.");
        return;
      }
      router.replace(destination);
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't sign you in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0E1330] p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#7957FF]/25 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <ShieldIcon className="h-16 w-auto shrink-0 drop-shadow-[0_0_14px_rgba(121,87,255,0.5)]" />
          <span className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight">LifeSure AI</span>
            <span className="block text-xs font-medium text-white/55">Advisor portal</span>
          </span>
        </div>
        <div className="relative max-w-md space-y-8">
          <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-tight">
            Everything you need for your next customer conversation.
          </h1>
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
        <p className="relative m-0 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Access is limited to your own customers and every view is recorded.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-[#F8F7FC] px-5 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="m-0 text-2xl font-extrabold tracking-tight text-[#171B3D]">Advisor sign in</h2>
            <p className="m-0 text-sm text-[#6F6A7C]">Use the advisor ID and password you were given.</p>
          </div>

          {loading ? (
            <p role="status" className="m-0 text-sm text-[#6F6A7C]">
              Checking your session…
            </p>
          ) : user && user.role !== "advisor" ? (
            <div role="alert" className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="m-0 text-sm font-semibold text-amber-900">You are signed in as a customer.</p>
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl bg-[#171B3D] px-4 py-2 text-sm font-bold text-white hover:bg-[#232857]"
              >
                Sign out to use an advisor account
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              className="space-y-4 rounded-2xl border border-[#E8E5F0] bg-white p-6 shadow-[0_1px_2px_rgba(23,27,61,0.04)]"
            >
              <TextField
                id="advisor-id"
                label="Advisor ID"
                type="text"
                autoComplete="username"
                placeholder="ADV-4KKBRK"
                value={id}
                onChange={setId}
                error={errors.id}
              />
              <TextField
                id="advisor-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                error={errors.password}
              />
              <FormAlert message={formError} />
              <SubmitButton busy={busy} idleLabel="Sign in to the advisor portal" busyLabel="Signing in…" />
            </form>
          )}

          <p className="m-0 text-center text-xs text-[#6F6A7C]">
            Not an advisor?{" "}
            <Link href="/sign-in" className="font-bold text-[#7957FF] hover:underline">
              Customer sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
