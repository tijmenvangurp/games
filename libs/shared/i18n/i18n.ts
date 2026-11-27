import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next, useTranslation } from "react-i18next";
import { en } from "./locales/en";
import { nl, type Translation } from "./locales/nl";

export const LANGUAGES = ["nl", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Nederlands blijft de standaard; de browsertaal telt bewust niet mee. */
const DEFAULT_LANGUAGE: Language = "nl";
const STORAGE_KEY = "games.language.v1";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: Translation };
  }
}

function isLanguage(value: string | undefined): value is Language {
  return LANGUAGES.some((language) => language === value);
}

function syncDocumentLanguage(language: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    document.title = i18next.t("home.title");
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = i18next.t("meta.description");
    }
  }
}

i18next.on("languageChanged", syncDocumentLanguage);

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { nl: { translation: nl }, en: { translation: en } },
    supportedLngs: LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    nonExplicitSupportedLngs: false,
    load: "languageOnly",
    // Synchroon laden: de teksten staan in de bundel, dus de eerste render is meteen goed.
    initAsync: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export const i18n = i18next;

export function setLanguage(language: Language): void {
  void i18next.changeLanguage(language);
}

/** De actieve taal buiten React, bijvoorbeeld in een store of een generator. */
export function currentLanguage(): Language {
  const language = i18next.resolvedLanguage;
  return isLanguage(language) ? language : DEFAULT_LANGUAGE;
}

export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  const language = instance.resolvedLanguage;
  return isLanguage(language) ? language : DEFAULT_LANGUAGE;
}

export { useTranslation };
