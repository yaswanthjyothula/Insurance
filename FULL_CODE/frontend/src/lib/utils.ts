import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Currency (INR - ₹)
 * Handles Crore (Cr) and Lakh (L) abbreviations or full comma separated formats
 */
export function formatINR(val: number, options: { compact?: boolean; precision?: number } = {}): string {
  if (isNaN(val) || val === null || val === undefined) return "₹0";
  const { compact = false, precision = 2 } = options;

  if (compact) {
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 10000000) {
      const cr = (abs / 10000000).toFixed(precision).replace(/\.00$/, "");
      return `${sign}₹${cr} Cr`;
    }
    if (abs >= 100000) {
      const lk = (abs / 100000).toFixed(precision).replace(/\.00$/, "");
      return `${sign}₹${lk} L`;
    }
    if (abs >= 1000) {
      const k = (abs / 1000).toFixed(1).replace(/\.0$/, "");
      return `${sign}₹${k} K`;
    }
    return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
  }

  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

/** Short insurer name for tight spaces, e.g. "HDFC Life Insurance Company Ltd" -> "HDFC", LIC stays "LIC". */
export function shortInsurerName(name: string): string {
  if (/Corporation of India|\(LIC\)/i.test(name)) return "LIC";
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/\s+(Life\s+)?Insurance.*$/i, "")
    .replace(/\s+Life$/i, "")
    .trim();
}
