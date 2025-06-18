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
  DropdownMenuItem,
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
  const [isTyping, setIsTyping] = React.useState(false)
  const [currentTranslation, setCurrentTranslation] = React.useState<{
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    translatedText: string;
  } | null>(null)
  const [pendingTranslation, setPendingTranslation] = React.useState<{
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
  } | null>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastAddedTranslationRef = React.useRef<string>('')
  const lastProcessedTextRef = React.useRef<string>('')
  
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
      // Show loading indicator immediately when typing
      setIsTyping(true)
      setPendingTranslation({
        text: normalizedText,
        sourceLanguage,
        targetLanguage
      })

      // Only trigger translation if the text has actually changed
      if (normalizedText !== lastProcessedTextRef.current) {
        typingTimeoutRef.current = setTimeout(() => {
          lastProcessedTextRef.current = normalizedText
          translate(normalizedText, sourceLanguage, targetLanguage, settings.saveWords)
        }, 500)
      }
    } else {
      setIsTyping(false)
      lastProcessedTextRef.current = ''
      setPendingTranslation(null)
    }
  }, [text, sourceLanguage, targetLanguage, translate])

  // Handle translation results
  React.useEffect(() => {
    if (
      translatedText &&
      !isLoading &&
      !error &&
      normalizeText(translatedText) !== '' &&
      normalizeText(text) !== '' &&
      translatedText !== lastAddedTranslationRef.current &&
      normalizeText(text) === lastProcessedTextRef.current // Only process if this matches the last processed text
    ) {
      lastAddedTranslationRef.current = translatedText
      
      // Update current translation
      setCurrentTranslation({
        text,
        sourceLanguage,
        targetLanguage,
        translatedText
      })
      
      // Only save to history if saveWords is enabled
      if (settings.saveWords) {
        addTranslation({
          source_language: sourceLanguage,
          target_language: targetLanguage,
          input_text: text,
          output_text: translatedText
        })
      }
      
      // Clear loading state
      setIsTyping(false)
      setPendingTranslation(null)
    }
  }, [translatedText, isLoading, error, addTranslation, sourceLanguage, targetLanguage, text, settings.saveWords])

  // Reset states when text is cleared
  React.useEffect(() => {
    if (!text) {
      lastAddedTranslationRef.current = ''
      lastProcessedTextRef.current = ''
      setIsTyping(false)
      setPendingTranslation(null)
      setCurrentTranslation(null)
    }
  }, [text])

  // Create a temporary translation for the loading state
  const loadingTranslation = React.useMemo(() => {
    if (!pendingTranslation?.text) return null;
    return {
      id: -1, // Temporary ID for loading state
      source_language: pendingTranslation.sourceLanguage,
      target_language: pendingTranslation.targetLanguage,
      input_text: pendingTranslation.text,
      output_text: '',
      timestamp: new Date().toISOString(),
      was_cached: false,
      is_loading: true
    };
  }, [pendingTranslation]);

  // Create a translation object for the current translation
  const currentTranslationObject = React.useMemo(() => {
    if (!currentTranslation) return null;
    return {
      id: -2, // Temporary ID for current translation
      source_language: currentTranslation.sourceLanguage,
      target_language: currentTranslation.targetLanguage,
      input_text: currentTranslation.text,
      output_text: currentTranslation.translatedText,
      timestamp: new Date().toISOString(),
      was_cached: false,
      is_loading: false
    };
  }, [currentTranslation]);

  return (
    <Card className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          {detectedSourceLanguage && detectedSourceLanguage !== sourceLanguage && (
            <Alert className="mb-4">
              <AlertDescription>
                Detected source language: {detectedSourceLanguage}
              </AlertDescription>
            </Alert>
          )}
          <History
            translations={[
              ...(loadingTranslation ? [loadingTranslation] : []),
              ...(currentTranslationObject ? [currentTranslationObject] : []),
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