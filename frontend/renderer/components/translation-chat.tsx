import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/use-translation'
import { useTranslationHistory } from '@/hooks/use-translation-history'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { History } from '@/components/history'
import { LanguageSelector } from '@/components/language-selector'
import { Card } from '@/components/ui/card'
import { useSettings } from '@/hooks/use-settings'
import { useLanguage } from '@/hooks/use-language'

// Helper function to normalize text for comparison
const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ')
}

export function TranslationChat() {
  const lastProcessedTextRef = React.useRef<string>('')
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const { settings } = useSettings()
  const {
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages
  } = useLanguage()

  const {
    text,
    setText,
    translatedText,
    isLoading,
    error,
    detectedSourceLanguage,
    translate
  } = useTranslation()

  const {
    translations,
    hasMore,
    isLoading: isHistoryLoading,
    loadMore,
    addTranslation,
    updateTranslation,
    deleteTranslation
  } = useTranslationHistory()

  const handleSourceChange = (value: string) => {
    setSourceLanguage(value)
  }

  const handleTargetChange = (value: string) => {
    setTargetLanguage(value)
  }

  const handleSwap = () => {
    swapLanguages()
  }

  // Handle text changes and trigger translation
  React.useEffect(() => {
    const normalizedText = normalizeText(text)

    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (normalizedText) {
      // Only trigger translation if the text has actually changed
      if (normalizedText !== lastProcessedTextRef.current) {
        typingTimeoutRef.current = setTimeout(() => {
          lastProcessedTextRef.current = normalizedText
          translate(
            normalizedText,
            sourceLanguage,
            targetLanguage,
            settings.saveWords
          )
        }, 500)
      }
    } else {
      lastProcessedTextRef.current = ''
    }

    // Cleanup timeout on unmount or when text changes
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [text, sourceLanguage, targetLanguage, translate, settings.saveWords])

  // Handle translation results
  React.useEffect(() => {
    if (
      translatedText &&
      !isLoading &&
      !error &&
      normalizeText(translatedText) !== '' &&
      normalizeText(text) !== '' &&
      normalizeText(text) === lastProcessedTextRef.current // Only process if this matches the last processed text
    ) {
      // Only save to history if saveWords is enabled
      if (settings.saveWords) {
        addTranslation({
          source_language: sourceLanguage,
          target_language: targetLanguage,
          input_text: text,
          output_text: translatedText
        })
      }
    }
  }, [
    translatedText,
    isLoading,
    error,
    addTranslation,
    sourceLanguage,
    targetLanguage,
    text,
    settings.saveWords
  ])

  // Create a temporary translation for the current text
  const currentTranslation = React.useMemo(() => {
    const normalizedInputText = normalizeText(text)
    if (!normalizedInputText) return null

    // Don't show current translation if it's already in history
    const isInHistory = translations.some(
      t =>
        normalizeText(t.input_text) === normalizedInputText &&
        t.source_language === sourceLanguage &&
        t.target_language === targetLanguage
    )

    if (isInHistory) return null

    // Only show temporary translation when we're actively loading
    // This prevents showing stale translations for new input text
    if (!isLoading) return null

    return {
      id: -Date.now(), // Negative timestamp for temporary ID to avoid conflicts
      source_language: sourceLanguage,
      target_language: targetLanguage,
      input_text: text,
      output_text: translatedText || '',
      timestamp: new Date().toISOString(),
      was_cached: false,
      is_loading: isLoading
    }
  }, [
    text,
    sourceLanguage,
    targetLanguage,
    isLoading,
    translatedText,
    translations
  ])

  return (
    <Card className="flex h-full flex-col border-0 bg-white">
      {!settings.saveWords && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            Translations will not be saved to history
          </AlertDescription>
        </Alert>
      )}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          {detectedSourceLanguage &&
            detectedSourceLanguage !== sourceLanguage && (
              <Alert>
                <AlertDescription>
                  Detected source language: {detectedSourceLanguage}
                </AlertDescription>
              </Alert>
            )}
          <History
            translations={[
              ...(currentTranslation ? [currentTranslation] : []),
              ...translations
            ]}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isHistoryLoading}
            onUpdateTranslation={updateTranslation}
            onDeleteTranslation={deleteTranslation}
          />
        </div>
      </div>
      <div className="bg-white">
        <Card className="overflow-hidden border-0 bg-white shadow-md">
          <Textarea
            placeholder="Enter text to translate..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[60px] resize-none rounded-none border-0 bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <div className="flex items-center justify-center border-0 bg-white px-4 py-2 shadow-none">
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceChange={handleSourceChange}
              onTargetChange={handleTargetChange}
              onSwap={handleSwap}
              className="border-0 shadow-none"
            />
          </div>
        </Card>
      </div>
    </Card>
  )
}
