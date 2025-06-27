import { apiClient } from '../api-client'

export interface Flashcard {
  id: number
  source_text: string
  translated_text: string
  source_language: string
  target_language: string
}

export interface FlashcardsResponse {
  flashcards: Flashcard[]
  count: number
  source_language: string
  target_language: string
  requested_limit: number
}

export interface FlashcardsRequest {
  source_lang: string
  target_lang: string
  limit?: number
}

export async function getFlashcards(request: FlashcardsRequest): Promise<FlashcardsResponse> {
  try {
    const response = await apiClient<FlashcardsResponse>('/translations/flashcards', {
      method: 'POST',
      body: JSON.stringify({
        source_lang: request.source_lang,
        target_lang: request.target_lang,
        limit: request.limit || 10
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return response
  } catch (error) {
    console.error('Flashcards error:', error)
    throw error
  }
} 