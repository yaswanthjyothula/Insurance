"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type MessageKey, type Messages } from "@/i18n/en";
import { DEFAULT_LANGUAGE, STORAGE_KEY, languageInfo, pickLanguage, type LanguageCode } from "@/i18n/languages";
import { loadMessages } from "@/i18n/load";
import { format, reverseIndex, type Params } from "@/i18n/translate";

interface I18nValue {
  lang: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** The text for a key in the current language, falling back to English. */
  t: (key: MessageKey, params?: Params) => string;
  /** Translates an exact English sentence that arrives as plain text (a validation message, a server reply). Unknown text is returned unchanged. */
  tx: (text: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const ENGLISH_TO_KEY = reverseIndex(en);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [messages, setMessages] = useState<Partial<Messages>>({});

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage can be blocked: the browser's language is used instead */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved choice is only readable after mount
    setLang(pickLanguage(saved, navigator.languages ?? [navigator.language]));
  }, []);

  useEffect(() => {
    const info = languageInfo(lang);
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.dir;
    let cancelled = false;
    loadMessages(lang)
      .then((loaded) => !cancelled && setMessages(loaded))
      .catch(() => !cancelled && setMessages({})); // a chunk that fails to load leaves the page in English
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLanguage = useCallback((code: LanguageCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* the choice then lasts until the page is closed */
    }
    setLang(code);
  }, []);

  const t = useCallback((key: MessageKey, params?: Params) => format(messages[key] ?? en[key] ?? key, params), [messages]);
  const tx = useCallback(
    (text: string) => {
      const key = ENGLISH_TO_KEY.get(text);
      return key ? (messages[key as MessageKey] ?? text) : text;
    },
    [messages],
  );

  const value = useMemo(() => ({ lang, setLanguage, t, tx }), [lang, setLanguage, t, tx]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>.");
  return context;
}

/** Shorthand for components that only need `t`. */
export function useT() {
  return useI18n().t;
}

/** Text as a component, for places a hook is awkward: `<T k="auth.signIn" />`. */
export function T({ k, values }: { k: MessageKey; values?: Params }) {
  return <>{useT()(k, values)}</>;
}
