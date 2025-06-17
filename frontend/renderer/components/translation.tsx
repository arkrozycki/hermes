import * as React from 'react'
import { LanguageSelector } from '@/components/ui/language-selector'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/use-translation'
import { useTranslationHistory } from '@/hooks/use-translation-history'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { History } from '@/components/history'

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
    addTranslation
  } = useTranslationHistory()

  const handleSourceChange = (value: string) => {
    setSourceLanguage(value)
  }

  const handleTargetChange = (value: string) => {
    setTargetLanguage(value)
  }

  const handleSwap = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    // Also swap the texts
    setText(translatedText)
  }

  // Trigger translation when text or languages change
  React.useEffect(() => {
    if (text) {
      translate(text, sourceLanguage, targetLanguage)
    }
  }, [text, sourceLanguage, targetLanguage, translate])

  // Add new translation to history when translation is complete
  React.useEffect(() => {
    if (translatedText && !isLoading && !error) {
      addTranslation({
        source_language: sourceLanguage,
        target_language: targetLanguage,
        input_text: text,
        output_text: translatedText
      })
    }
  }, [translatedText, isLoading, error, addTranslation, sourceLanguage, targetLanguage, text])

  return (
    <div className="flex flex-col gap-4 p-4">
      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceChange={handleSourceChange}
        onTargetChange={handleTargetChange}
        onSwap={handleSwap}
      />
      {detectedSourceLanguage && detectedSourceLanguage !== sourceLanguage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Detected language: {detectedSourceLanguage}
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
          <Textarea
            placeholder="Translation will appear here..."
            value={translatedText}
            readOnly
            className="bg-muted max-h-[40px] min-h-[40px] resize-none"
          />
          {isLoading && (
            <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {error && (
            <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
              <Alert
                variant="destructive"
                className="w-[80%]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                  {error.code && ` (${error.code})`}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
      <History
        translations={translations}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoading={isHistoryLoading}
      />
    </div>
  )
}
