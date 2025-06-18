import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/use-translation'
import { useTranslationHistory } from '@/hooks/use-translation-history'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { History } from '@/components/history'
import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Settings as SettingsComponent } from '@/components/settings'
import { useSettings } from '@/hooks/use-settings'

// Helper function to normalize text for comparison
const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ')
}

export function TranslationChat() {
  const [sourceLanguage, setSourceLanguage] = React.useState('en')
  const [targetLanguage, setTargetLanguage] = React.useState('es')
  const [currentText, setCurrentText] = React.useState('')
  const lastProcessedTextRef = React.useRef<string>('')
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const { settings } = useSettings()
  
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

  // Handle text changes and trigger translation
  React.useEffect(() => {
    const normalizedText = normalizeText(text)
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    if (normalizedText) {
      setCurrentText(normalizedText)
      // Only trigger translation if the text has actually changed
      if (normalizedText !== lastProcessedTextRef.current) {
        typingTimeoutRef.current = setTimeout(() => {
          lastProcessedTextRef.current = normalizedText
          translate(normalizedText, sourceLanguage, targetLanguage, settings.saveWords)
        }, 500)
      }
    } else {
      setCurrentText('')
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
  }, [translatedText, isLoading, error, addTranslation, sourceLanguage, targetLanguage, text, settings.saveWords])

  // Create a temporary translation for the current text
  const currentTranslation = React.useMemo(() => {
    if (!currentText) return null;
    
    // Don't show current translation if it's already in history
    const isInHistory = translations.some(t => 
      normalizeText(t.input_text) === normalizeText(currentText) &&
      t.source_language === sourceLanguage &&
      t.target_language === targetLanguage
    );
    
    if (isInHistory) return null;
    
    // Only show the card if we're loading or have a translation
    if (!isLoading && !translatedText) return null;
    
    return {
      id: -1, // Temporary ID for current translation
      source_language: sourceLanguage,
      target_language: targetLanguage,
      input_text: currentText,
      output_text: isLoading ? '' : translatedText,
      timestamp: new Date().toISOString(),
      was_cached: false,
      is_loading: isLoading
    };
  }, [currentText, sourceLanguage, targetLanguage, isLoading, translatedText, translations, settings.saveWords]);

  return (
    <Card className="flex h-screen flex-col border-0">
      {!settings.saveWords && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            Translations will not be saved to history
          </AlertDescription>
        </Alert>
      )}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          {detectedSourceLanguage && detectedSourceLanguage !== sourceLanguage && (
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
      <div className="bg-background">
        <Card className="border-0 shadow-md overflow-hidden">
          <Textarea
            placeholder="Enter text to translate..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
            autoFocus
          />
          <div className="flex items-center justify-between px-4 py-2 border-0 shadow-none">
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
              <DropdownMenuContent align="end" className="w-80">
                <SettingsComponent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </div>
    </Card>
  )
} 