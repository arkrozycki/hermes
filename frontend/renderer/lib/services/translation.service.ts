import { apiClient } from '../api-client'

interface TranslationResponse {
  translated_text: string
}

export async function translateText(text: string | undefined | null, targetLanguage: string): Promise<string> {
  if (!text || typeof text !== 'string' || !text.trim()) return ''

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
    return response.translated_text
  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
} 