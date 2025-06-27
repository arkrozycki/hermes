import { useState, useCallback, useEffect } from 'react'
import { TranslationHistory } from '@/components/history'
import { getTranslationHistory, updateTranslation as updateTranslationApi, deleteTranslation as deleteTranslationApi } from '@/services/translation-history'

export function useTranslationHistory() {
  const [translations, setTranslations] = useState<TranslationHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchHistory = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getTranslationHistory(page, 10)
      
      if (page === 1) {
        setTranslations(response.translations)
      } else {
        setTranslations(prev => {
          // Deduplicate by ID to prevent duplicate keys
          const existingIds = new Set(prev.map(t => t.id))
          const newTranslations = response.translations.filter(t => !existingIds.has(t.id))
          return [...prev, ...newTranslations]
        })
      }
      
      setCurrentPage(response.pagination.current_page)
      setHasMore(response.pagination.current_page < response.pagination.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch translation history')
      if (err instanceof Error && err.message.includes('401')) {
        setTranslations([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchHistory(currentPage + 1)
    }
  }, [isLoading, hasMore, currentPage, fetchHistory])

  const addTranslation = useCallback((translation: Omit<TranslationHistory, 'id' | 'timestamp' | 'was_cached'>) => {
    const newTranslation: TranslationHistory = {
      ...translation,
      id: -(Date.now() + Math.random()), // Negative ID to avoid conflicts with database IDs
      timestamp: new Date().toISOString(),
      was_cached: false
    }
    setTranslations(prev => {
      // Remove any existing translation with the same content to avoid duplicates
      const filtered = prev.filter(t => 
        t.id !== newTranslation.id && 
        !(t.input_text === translation.input_text && 
          t.source_language === translation.source_language && 
          t.target_language === translation.target_language)
      )
      return [newTranslation, ...filtered]
    })
  }, [])

  const updateTranslation = useCallback(async (id: number, outputText: string) => {
    try {
      const updatedTranslation = await updateTranslationApi(id, { output_text: outputText })
      setTranslations(prev => 
        prev.map(translation => 
          translation.id === id ? updatedTranslation : translation
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update translation')
      throw err
    }
  }, [])

  const deleteTranslation = useCallback(async (id: number) => {
    try {
      // Only call API for positive IDs (real database records)
      if (id > 0) {
        await deleteTranslationApi(id)
      }
      // Always remove from local state
      setTranslations(prev => prev.filter(translation => translation.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete translation')
      throw err
    }
  }, [])

  // Load history on initial mount
  useEffect(() => {
    fetchHistory(1)
  }, [fetchHistory])

  return {
    translations,
    isLoading,
    error,
    hasMore,
    loadMore,
    fetchHistory,
    addTranslation,
    updateTranslation,
    deleteTranslation
  }
} 