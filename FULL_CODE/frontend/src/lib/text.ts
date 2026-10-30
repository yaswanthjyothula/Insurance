const ACRONYMS = new Set(["nri", "ulip", "nps", "hni"]);

/** The pack stores tags like "nri_clients"; people should read "NRI clients". */
export function humaniseTag(tag: string): string {
  const words = tag
    .split("_")
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word));
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
