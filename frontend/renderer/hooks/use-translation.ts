import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const requestIdRef = useRef(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const translate = useCallback(async (
    text: string, 
    sourceLanguage: string | null, 
    targetLanguage: string,
    saveToDb: boolean = true
  ) => {
    if (!text.trim()) {
      setTranslatedText('')
      setDetectedSourceLanguage(null)
      setIsLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current

    try {
      const translatedText = await translateText(text, targetLanguage, saveToDb)
      // Only update state if this is still the most recent request
      if (currentRequestId === requestIdRef.current) {
        setTranslatedText(translatedText)
        setDetectedSourceLanguage(sourceLanguage)
      }
    } catch (err) {
      // Only update error state if this is still the most recent request
      if (currentRequestId === requestIdRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        const errorCode = err instanceof Error && 'code' in err ? String(err.code) : undefined
        setError({ message: errorMessage, code: errorCode })
        setTranslatedText('')
        setDetectedSourceLanguage(null)
      }
    } finally {
      // Only update loading state if this is still the most recent request
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Create a stable debounced version of the translate function
  const debouncedTranslate = useMemo(
    () => debounce((text: string, sourceLanguage: string | null, targetLanguage: string, saveToDb: boolean = true) => {
      // Clear any existing loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      // Set loading state after debounce delay
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(true)
        translate(text, sourceLanguage, targetLanguage, saveToDb)
      }, 500)
    }, 500),
    [translate]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedTranslate.cancel()
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
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