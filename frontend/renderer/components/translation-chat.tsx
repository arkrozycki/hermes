import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/use-translation'
import { useTranslationHistory } from '@/hooks/use-translation-history'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { History } from '@/components/history'
import { LanguageSelector } from '@/components/ui/language-selector'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { debounce } from '@/utils/debounce'

// Helper function to normalize text for comparison
const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ')
}

export function TranslationChat() {
  const [sourceLanguage, setSourceLanguage] = React.useState('en')
  const [targetLanguage, setTargetLanguage] = React.useState('es')
  const [pendingTranslation, setPendingTranslation] = React.useState<{
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
  } | null>(null)
  
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

  // Create a debounced version of addTranslation
  const debouncedAddTranslation = React.useCallback(
    debounce((translation: Parameters<typeof addTranslation>[0]) => {
      addTranslation(translation)
    }, 1000),
    [addTranslation]
  )

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

  // Handle text changes and trigger translation
  React.useEffect(() => {
    const normalizedText = normalizeText(text)
    if (normalizedText) {
      setPendingTranslation({
        text,
        sourceLanguage,
        targetLanguage
      })
    }
  }, [text, sourceLanguage, targetLanguage])

  // Debounced translation effect
  React.useEffect(() => {
    if (pendingTranslation) {
      translate(
        pendingTranslation.text,
        pendingTranslation.sourceLanguage,
        pendingTranslation.targetLanguage
      )
    }
  }, [pendingTranslation, translate])

  // Handle translation results
  React.useEffect(() => {
    if (translatedText && !isLoading && !error && pendingTranslation) {
      debouncedAddTranslation({
        source_language: pendingTranslation.sourceLanguage,
        target_language: pendingTranslation.targetLanguage,
        input_text: pendingTranslation.text,
        output_text: translatedText
      })
    }
  }, [translatedText, isLoading, error, debouncedAddTranslation, pendingTranslation])

  // Cleanup debounced function on unmount
  React.useEffect(() => {
    return () => {
      debouncedAddTranslation.cancel()
    }
  }, [debouncedAddTranslation])

  return (
    <Card className="flex h-[calc(100vh-2rem)] flex-col">
      <ScrollArea className="flex-1 p-4 [&_[data-radix-scroll-area-scrollbar]]:hidden">
        {detectedSourceLanguage && detectedSourceLanguage !== sourceLanguage && (
          <Alert className="mb-4">
            <AlertDescription>
              Detected source language: {detectedSourceLanguage}
            </AlertDescription>
          </Alert>
        )}
        <History
          translations={translations}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={isHistoryLoading}
          onUpdateTranslation={updateTranslation}
          onDeleteTranslation={deleteTranslation}
        />
      </ScrollArea>
      <div className="bg-background p-4">
        <Card className="rounded-lg border shadow-md overflow-hidden">
          <Textarea
            placeholder="Enter text to translate..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 rounded-none"
            autoFocus
          />
          <div className="flex items-center justify-between px-4 py-2 rounded-b-lg">
            <LanguageSelector
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onSourceChange={handleSourceChange}
              onTargetChange={handleTargetChange}
              onSwap={handleSwap}
              className="border-0 shadow-none"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="border-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-0 shadow-md">
                <DropdownMenuItem className="border-0">
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </div>
    </Card>
  )
} 