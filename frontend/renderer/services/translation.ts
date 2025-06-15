interface TranslationRequest {
  text: string
  source_language?: string | null
  target_language: string
}

interface TranslationResponse {
  translated_text: string
  source_language: string
  target_language: string
}

interface TranslationError {
  message: string
  code?: string
}

export async function translateText({
  text,
  source_language,
  target_language,
}: TranslationRequest): Promise<TranslationResponse> {
  const response = await fetch('/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      source_language,
      target_language,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Translation failed')
  }

  return response.json()
} 