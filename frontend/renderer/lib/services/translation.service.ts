import { apiClient } from '../api-client'

interface TranslationResponse {
  translated_text: string
  translated_texts?: string[] // NEW: optional array of synonyms
}

// Simple cache using a Map
const translationCache = new Map<string, string>()

// Create a cache key from text and target language
function getCacheKey(text: string, targetLanguage: string): string {
  return `${text}:${targetLanguage}`
}

export async function translateText(
  text: string | undefined | null, 
  targetLanguage: string,
  saveToDb: boolean = true
): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) return ''

  // Check cache first
  const cacheKey = getCacheKey(text, targetLanguage)
  const cachedTranslation = translationCache.get(cacheKey)
  if (cachedTranslation !== undefined) {
    return cachedTranslation
  }

  try {
    const response = await apiClient<TranslationResponse>('/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        save_to_db: saveToDb
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Support for multiple translated texts (synonyms).
    // If the API returns a list, join them with a comma and space.
    const finalTranslation = Array.isArray(response.translated_texts) && response.translated_texts.length
      ? response.translated_texts.join(', ')
      : response.translated_text

    translationCache.set(cacheKey, finalTranslation)
    return finalTranslation
  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
} 