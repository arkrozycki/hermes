import { useState, useCallback, useEffect } from 'react'
import { debounce } from '@/utils/debounce'
import { translateText } from '@/lib/services/translation.service'

interface TranslationError {
  message: string
  code?: string
}

export function useTranslation() {
  const [text, setText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TranslationError | null>(null)
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string | null>(null)

  const translate = useCallback(async (text: string, sourceLanguage: string | null, targetLanguage: string) => {
    if (!text.trim()) {
      setTranslatedText('')
      setDetectedSourceLanguage(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const translatedText = await translateText(text, targetLanguage)
      setTranslatedText(translatedText)
      // For now, we'll just use the source language as detected
      setDetectedSourceLanguage(sourceLanguage)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      const errorCode = err instanceof Error && 'code' in err ? String(err.code) : undefined
      setError({ message: errorMessage, code: errorCode })
      setTranslatedText('')
      setDetectedSourceLanguage(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a debounced version of the translate function
  const debouncedTranslate = useCallback(
    debounce((text: string, sourceLanguage: string | null, targetLanguage: string) => {
      translate(text, sourceLanguage, targetLanguage)
    }, 500),
    [translate]
  )

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedTranslate.cancel()
    }
  }, [debouncedTranslate])

  return {
    text,
    setText,
    translatedText,
    isLoading,
    error,
    detectedSourceLanguage,
    translate: debouncedTranslate,
  }
} 