"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { validateLogin, type FieldErrors } from "@/components/auth/form-validation";
import { errorMessage } from "@/lib/error-message";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormAlert } from "@/components/auth/FormAlert";

export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateLogin({ email, password });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      onSuccess();
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't sign you in. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        id="login-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
      />
      <TextField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />
      <FormAlert message={formError} />
      <SubmitButton busy={busy} idleLabel="Sign in" busyLabel="Signing in…" />
    </form>
  );
}
