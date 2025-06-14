import { debounce } from "../lib/utils";

const STORAGE_KEY = "googleApiKey";
const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

const getCacheKey = (query: string, from: string, to: string): string => {
  return `${from}:${to}:${query}`;
};

export const translateText = async (query: string, from: string = "en", to: string = "es"): Promise<string> => {
  if (!query.trim()) {
    return Promise.resolve("");
  }

  const cacheKey = getCacheKey(query, from, to);
  const cachedResult = translationCache.get(cacheKey);
  if (cachedResult) {
    return Promise.resolve(cachedResult);
  }

  const apiKey = localStorage.getItem(STORAGE_KEY);
  if (!apiKey) {
    throw new Error("API key not set. [⌘+,] to open settings.");
  }

  const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: query,
      source: from,
      target: to,
      format: "text",
    }),
  });

  const json = await response.json();
  const text = json?.data?.translations?.[0]?.translatedText ?? `⚠️ ${response.status} ${response.statusText}`;

  if (text && !text.startsWith("⚠️")) {
    translationCache.set(cacheKey, text);
  }

  return text;
};

// Debounced version of translateText with the same type signature
export const debouncedTranslateText: typeof translateText = debounce(translateText, 300);

// Optionally, add a function to get translation history
export const getTranslationHistory = (): string[] => {
  return Array.from(translationCache.keys());
};
