import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/use-translation'
import { useTranslationHistory } from '@/hooks/use-translation-history'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { History } from '@/components/history'
import { LanguageSelector } from '@/components/language-selector'

export function Translation() {
  const [sourceLanguage, setSourceLanguage] = React.useState('en')
  const [targetLanguage, setTargetLanguage] = React.useState('es')
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
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }

  // Trigger translation when text or languages change
  React.useEffect(() => {
    if (text) {
      translate(text, sourceLanguage, targetLanguage)
    }
  }, [text, sourceLanguage, targetLanguage, translate])

  React.useEffect(() => {
    if (translatedText && !isLoading && !error) {
      addTranslation({
        source_language: sourceLanguage,
        target_language: targetLanguage,
        input_text: text,
        output_text: translatedText
      })
    }
  }, [
    translatedText,
    isLoading,
    error,
    addTranslation,
    sourceLanguage,
    targetLanguage,
    text
  ])

  return (
    <div className="flex flex-col gap-4">
      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceChange={handleSourceChange}
        onTargetChange={handleTargetChange}
        onSwap={handleSwap}
      />
      {detectedSourceLanguage && detectedSourceLanguage !== sourceLanguage && (
        <Alert>
          <AlertDescription>
            Detected source language: {detectedSourceLanguage}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Textarea
            placeholder="Enter text to translate..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="max-h-[40px] min-h-[40px] resize-none"
          />
        </div>
        <div className="relative">
          <div className="border-input bg-muted/50 text-muted-foreground min-h-[40px] w-full rounded-md border px-3 py-2 text-sm">
            {(() => {
              const parts = translatedText
                .split(/[\n,]+/)
                .map(p => p.trim())
                .filter(Boolean)

              if (parts.length === 0) return null

              return (
                <>
                  <span className="block text-right font-medium">
                    {parts[0]}
                  </span>
                  {parts.slice(1).map((alt, idx) => (
                    <span
                      key={idx}
                      className="mt-2 block text-right text-xs">
                      {alt}
                    </span>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      </div>
      <History
        translations={translations}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isHistoryLoading}
        onUpdateTranslation={updateTranslation}
        onDeleteTranslation={deleteTranslation}
      />
    </div>
  )
}
