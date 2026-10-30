export const MIN_PASSWORD_LENGTH = 8;
export const MIN_NAME_LENGTH = 2;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CredentialValues {
  email: string;
  password: string;
}

export interface RegistrationValues extends CredentialValues {
  fullName: string;
  confirmPassword: string;
}

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function validateLogin(values: CredentialValues): FieldErrors<"email" | "password"> {
  const errors: FieldErrors<"email" | "password"> = {};
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegistration(values: RegistrationValues): FieldErrors<keyof RegistrationValues> {
  const errors: FieldErrors<keyof RegistrationValues> = {};
  if (values.fullName.trim().length < MIN_NAME_LENGTH) errors.fullName = "Enter your full name.";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (values.password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (values.confirmPassword !== values.password) errors.confirmPassword = "The two passwords don't match.";
  return errors;
}
