import { debounce } from "../lib/utils";
import { apiService } from "./apiService";

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

  try {
    const response = await apiService.translateText({
      text: query,
      source_language: from,
      target_language: to
    });

    const text = response.translated_text;
    if (text) {
      translationCache.set(cacheKey, text);
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error("Failed to translate text. Please try again.");
  }
};

// Debounced version of translateText with the same type signature
export const debouncedTranslateText: typeof translateText = debounce(translateText, 300);

// Optionally, add a function to get translation history
export const getTranslationHistory = (): string[] => {
  return Array.from(translationCache.keys());
};
