"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/components/auth/session-helpers";
import { validateLogin, type FieldErrors } from "@/components/auth/form-validation";
import { errorMessage } from "@/lib/error-message";
import { useT } from "@/i18n/I18nProvider";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormAlert } from "@/components/auth/FormAlert";

export function SignInForm({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const { signIn } = useAuth();
  const t = useT();
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
      onSuccess(await signIn(email.trim(), password));
    } catch (error) {
      setFormError(errorMessage(error, t("auth.signIn.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        id="login-email"
        label={t("auth.signIn.idLabel")}
        type="text"
        autoComplete="username"
        placeholder={t("auth.signIn.idPlaceholder")}
        value={email}
        onChange={setEmail}
        error={errors.email}
      />
      <TextField
        id="login-password"
        label={t("auth.signIn.password")}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />
      <FormAlert message={formError} />
      <SubmitButton busy={busy} idleLabel={t("common.signIn")} busyLabel={t("auth.signIn.busy")} />
    </form>
  );
}
