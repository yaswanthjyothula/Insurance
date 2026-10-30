export const MIN_NEW_PASSWORD = 8;

export interface PasswordDraft {
  current: string;
  next: string;
  confirm: string;
}

export function validatePasswordChange(draft: PasswordDraft): Partial<Record<keyof PasswordDraft, string>> {
  const errors: Partial<Record<keyof PasswordDraft, string>> = {};
  if (!draft.current) errors.current = "Enter your current password.";
  if (draft.next.length < MIN_NEW_PASSWORD) errors.next = `Use at least ${MIN_NEW_PASSWORD} characters.`;
  else if (draft.next === draft.current) errors.next = "Choose a password different from your current one.";
  if (draft.confirm !== draft.next) errors.confirm = "The two passwords don't match.";
  return errors;
}
