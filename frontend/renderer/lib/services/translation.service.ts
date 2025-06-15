import { apiClient } from '../api-client'

interface TranslationResponse {
  translated_text: string
}

// Simple cache using a Map
const translationCache = new Map<string, string>()

// Create a cache key from text and target language
function getCacheKey(text: string, targetLanguage: string): string {
  return `${text}:${targetLanguage}`
}

export async function translateText(text: string | undefined | null, targetLanguage: string): Promise<string> {
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
        target_language: targetLanguage
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Cache successful translation
    translationCache.set(cacheKey, response.translated_text)
    return response.translated_text
  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
} 