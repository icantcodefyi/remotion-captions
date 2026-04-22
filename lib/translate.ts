import type { Caption } from "@remotion/captions";

export type LanguageCode =
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "it"
  | "hi"
  | "ja"
  | "ko"
  | "zh"
  | "ar"
  | "ru"
  | "nl"
  | "tr"
  | "id"
  | "vi";

export type Language = {
  code: LanguageCode;
  name: string;
  native: string;
};

export const LANGUAGES: Language[] = [
  { code: "es", name: "Spanish", native: "Español" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
];

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/**
 * Translation request wire format. We send the full caption array to the
 * server so it can page the captions into sentence-sized groups, translate
 * each group as a unit (for context), and redistribute the translated text
 * across the original timings.
 */
export type TranslateRequest = {
  captions: Caption[];
  targetLanguage: LanguageCode;
  wordsPerPage: number;
};

export type TranslateResponse = {
  captions: Caption[];
  pageCount: number;
};
