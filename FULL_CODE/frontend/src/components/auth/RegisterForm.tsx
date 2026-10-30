"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MIN_PASSWORD_LENGTH, validateRegistration, type FieldErrors, type RegistrationValues } from "@/components/auth/form-validation";
import { errorMessage } from "@/lib/error-message";
import { useT } from "@/i18n/I18nProvider";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormAlert } from "@/components/auth/FormAlert";

const EMPTY_VALUES: RegistrationValues = { fullName: "", email: "", password: "", confirmPassword: "" };

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const t = useT();
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
      setFormError(errorMessage(error, t("auth.register.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField id="register-name" label={t("auth.register.fullName")} autoComplete="name" {...bind("fullName")} />
      <TextField
        id="register-email"
        label={t("auth.register.email")}
        type="email"
        autoComplete="email"
        placeholder={t("auth.register.emailPlaceholder")}
        {...bind("email")}
      />
      <TextField
        id="register-password"
        label={t("auth.register.passwordLabel", { min: MIN_PASSWORD_LENGTH })}
        type="password"
        autoComplete="new-password"
        {...bind("password")}
      />
      <TextField
        id="register-confirm"
        label={t("auth.register.confirm")}
        type="password"
        autoComplete="new-password"
        {...bind("confirmPassword")}
      />
      <FormAlert message={formError} />
      <SubmitButton busy={busy} idleLabel={t("auth.panel.tabCreate")} busyLabel={t("auth.register.busy")} />
    </form>
  );
}
