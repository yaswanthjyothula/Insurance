"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MIN_PASSWORD_LENGTH, validateRegistration, type FieldErrors, type RegistrationValues } from "@/components/auth/form-validation";
import { errorMessage } from "@/lib/error-message";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormAlert } from "@/components/auth/FormAlert";

const EMPTY_VALUES: RegistrationValues = { fullName: "", email: "", password: "", confirmPassword: "" };

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [values, setValues] = useState<RegistrationValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors<keyof RegistrationValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bind = (field: keyof RegistrationValues) => ({
    value: values[field],
    onChange: (next: string) => setValues((current) => ({ ...current, [field]: next })),
    error: errors[field],
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateRegistration(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await signUp({ full_name: values.fullName.trim(), email: values.email.trim(), password: values.password });
      onSuccess();
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't create your account. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField id="register-name" label="Full name" autoComplete="name" {...bind("fullName")} />
      <TextField
        id="register-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        {...bind("email")}
      />
      <TextField
        id="register-password"
        label={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`}
        type="password"
        autoComplete="new-password"
        {...bind("password")}
      />
      <TextField id="register-confirm" label="Confirm password" type="password" autoComplete="new-password" {...bind("confirmPassword")} />
      <FormAlert message={formError} />
      <SubmitButton busy={busy} idleLabel="Create account" busyLabel="Creating account…" />
    </form>
  );
}
