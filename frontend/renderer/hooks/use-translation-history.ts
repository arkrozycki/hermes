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
        setTranslations(prev => [...prev, ...response.translations])
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
      id: Date.now(),
      timestamp: new Date().toISOString(),
      was_cached: false
    }
    setTranslations(prev => [newTranslation, ...prev.filter(t => t.id !== newTranslation.id)])
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
      await deleteTranslationApi(id)
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