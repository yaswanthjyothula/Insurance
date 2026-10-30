export type Params = Record<string, string | number>;

/** Fills {name}-style placeholders. A placeholder with no value is left as written, so a gap is visible rather than blank. */
export function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

/** The {placeholders} a message uses, sorted. Translations must use exactly the same ones as the English. */
export function placeholders(message: string): string[] {
  return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}

/** English text -> key, for translating exact English sentences that come from code or the server. The first key for a text wins. */
export function reverseIndex(messages: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [key, text] of Object.entries(messages)) if (!index.has(text)) index.set(text, key);
  return index;
}
