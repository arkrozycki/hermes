'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, RotateCcw, BookOpen, ChevronDown } from 'lucide-react'
import {
  getFlashcards,
  type Flashcard
} from '@/lib/services/flashcards.service'
import { useLanguage } from '@/hooks/use-language'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface FlashcardsTabProps {
  // Configurable timers (in milliseconds) - now optional defaults
  sourceDuration?: number
  hiddenDuration?: number
  translatedDuration?: number
  pauseDuration?: number
}

type FlashcardState = 'source' | 'hidden' | 'translated' | 'pause'
type ComponentState =
  | 'selection'
  | 'loading'
  | 'running'
  | 'paused'
  | 'error'
  | 'empty'

export function FlashcardsTab({
  sourceDuration = 1000, // 1 second for source
  hiddenDuration = 2000, // 2 seconds hidden
  translatedDuration = 2000, // 2 seconds for translated
  pauseDuration = 2000 // 2 seconds pause before next word
}: FlashcardsTabProps) {
  const { sourceLanguage: sourceLang, targetLanguage: targetLang } =
    useLanguage()

  // Load timer settings from localStorage with fallbacks
  const loadTimerSettings = React.useCallback(() => {
    try {
      const saved = localStorage.getItem('flashcards-timer-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          source: parsed.source ?? sourceDuration,
          hidden: parsed.hidden ?? hiddenDuration,
          translated: parsed.translated ?? translatedDuration,
          pause: parsed.pause ?? pauseDuration
        }
      }
    } catch (error) {
      console.warn('Failed to load timer settings from localStorage:', error)
    }
    return {
      source: sourceDuration,
      hidden: hiddenDuration,
      translated: translatedDuration,
      pause: pauseDuration
    }
  }, [sourceDuration, hiddenDuration, translatedDuration, pauseDuration])

  // Timer settings state (in milliseconds)
  const [timers, setTimers] = React.useState(loadTimerSettings)

  // Save timer settings to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('flashcards-timer-settings', JSON.stringify(timers))
    } catch (error) {
      console.warn('Failed to save timer settings to localStorage:', error)
    }
  }, [timers])

  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)

  const [flashcards, setFlashcards] = React.useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [componentState, setComponentState] =
    React.useState<ComponentState>('selection')
  const [error, setError] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [cardState, setCardState] = React.useState<FlashcardState>('source')
  const [selectedLimit, setSelectedLimit] = React.useState<number>(10)

  // Use ref to avoid stale closure issues
  const flashcardsRef = React.useRef<Flashcard[]>([])

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const hiddenTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const translatedTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Calculate total duration using current timer settings
  const TOTAL_DURATION =
    timers.source + timers.hidden + timers.translated + timers.pause

  // Update ref when flashcards state changes
  React.useEffect(() => {
    flashcardsRef.current = flashcards
  }, [flashcards])

  const clearTimers = React.useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
    if (hiddenTimeoutRef.current) {
      clearTimeout(hiddenTimeoutRef.current)
      hiddenTimeoutRef.current = null
    }
    if (translatedTimeoutRef.current) {
      clearTimeout(translatedTimeoutRef.current)
      translatedTimeoutRef.current = null
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }, [])

  const nextCard = React.useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1
      const currentFlashcards = flashcardsRef.current

      if (next >= currentFlashcards.length) {
        // End of flashcards - go to selection for another round
        setComponentState('selection')
        setProgress(0)
        setCardState('source')
        return 0 // Reset to beginning
      }
      return next
    })
  }, []) // No dependencies to prevent recreation

  const startCard = React.useCallback(() => {
    clearTimers()
    setCardState('source')

    const indexAtStart = currentIndex // capture index for this card
    const totalCards = flashcardsRef.current.length || 1
    let startTime = Date.now()

    // Progress bar animation across entire deck
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const cardFraction = Math.min(elapsed / TOTAL_DURATION, 1) // 0..1
      const overallProgress = ((indexAtStart + cardFraction) / totalCards) * 100

      setProgress(Math.min(overallProgress, 100))
    }, 16) // ~60fps for smooth animation

    // Set up phase transitions with separate timeouts using current timer settings
    hiddenTimeoutRef.current = setTimeout(() => {
      setCardState('hidden')
    }, timers.source)

    translatedTimeoutRef.current = setTimeout(() => {
      setCardState('translated')
    }, timers.source + timers.hidden)

    pauseTimeoutRef.current = setTimeout(
      () => {
        setCardState('pause')
      },
      timers.source + timers.hidden + timers.translated
    )

    // Only one call to nextCard at the end
    intervalRef.current = setTimeout(() => {
      clearTimers()
      nextCard()
    }, TOTAL_DURATION)
  }, [clearTimers, TOTAL_DURATION, timers, nextCard, currentIndex])

  const fetchFlashcardsAndStart = React.useCallback(
    async (limit: number) => {
      if (!sourceLang || !targetLang) return

      setComponentState('loading')
      setError(null)
      setSelectedLimit(limit)

      try {
        const response = await getFlashcards({
          source_lang: sourceLang,
          target_lang: targetLang,
          limit
        })

        if (response.flashcards.length === 0) {
          setComponentState('empty')
          setFlashcards([])
        } else {
          setFlashcards(response.flashcards)
          setCurrentIndex(0)
          setProgress(0)
          setCardState('source')
          setComponentState('running')

          // Auto-start immediately after loading
          setTimeout(() => {
            startCard()
          }, 100)
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch flashcards'
        )
        setComponentState('error')
      }
    },
    [sourceLang, targetLang, startCard]
  )

  const handlePause = React.useCallback(() => {
    clearTimers()
    setComponentState('paused')
  }, [clearTimers])

  const handleResume = React.useCallback(() => {
    setComponentState('running')
    startCard()
  }, [startCard])

  const handleRestart = React.useCallback(() => {
    setComponentState('selection')
    clearTimers()
    setProgress(0)
    setCurrentIndex(0)
    setCardState('source')
    setFlashcards([])
  }, [clearTimers])

  // Auto-start card when index changes and we're running
  React.useEffect(() => {
    if (
      componentState === 'running' &&
      flashcards.length > 0 &&
      currentIndex > 0
    ) {
      startCard()
    }
  }, [currentIndex, componentState, flashcards.length, startCard])

  // Cleanup intervals on unmount
  React.useEffect(() => {
    return clearTimers
  }, [clearTimers])

  const currentCard = flashcards[currentIndex]

  const renderCardContent = () => {
    if (!currentCard) return null

    switch (cardState) {
      case 'source':
        return (
          <div className="text-primary text-4xl font-bold">
            {currentCard.source_text}
          </div>
        )
      case 'hidden':
        return (
          <div className="text-muted-foreground/30 text-4xl font-bold">
            • • •
          </div>
        )
      case 'translated':
        return (
          <div className="space-y-2">
            <div className="text-primary text-4xl font-bold">
              {currentCard.translated_text}
            </div>
          </div>
        )
      case 'pause':
        return (
          <div className="text-muted-foreground/10 text-4xl font-bold">
            &nbsp;
          </div>
        )
      default:
        return null
    }
  }

  const limitOptions = [5, 10, 25, 50]

  // Helper function to format time display
  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + 's'
  }

  // Slider change handlers
  const handleTimerChange = (type: keyof typeof timers, value: number[]) => {
    setTimers(prev => ({
      ...prev,
      [type]: value[0]
    }))
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
      <div className="flex min-h-full items-start justify-center pb-8 pt-8">
        <Card className="w-full max-w-2xl border-0 bg-white p-8 text-center shadow-none">
          {componentState === 'selection' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="space-y-2">
                <BookOpen className="text-primary mx-auto h-12 w-12" />
              </div>

              <div className="grid w-full max-w-md grid-cols-4 gap-4">
                {limitOptions.map(limit => (
                  <Button
                    key={limit}
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg font-semibold"
                    onClick={() => fetchFlashcardsAndStart(limit)}>
                    {limit}
                  </Button>
                ))}
              </div>

              <p className="text-muted-foreground text-sm">
                {sourceLang} → {targetLang}
              </p>

              {/* Advanced Settings */}
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full max-w-md">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between">
                    <span className="text-sm">Advanced</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-4 text-left">
                    {/* Source Duration */}
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm font-medium">
                        <span>Source Duration</span>
                        <span className="text-muted-foreground">
                          {formatTime(timers.source)}
                        </span>
                      </Label>
                      <Slider
                        value={[timers.source]}
                        onValueChange={value =>
                          handleTimerChange('source', value)
                        }
                        max={5000}
                        min={500}
                        step={500}
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        How long to show the source word
                      </p>
                    </div>

                    {/* Hidden Duration */}
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm font-medium">
                        <span>Hidden Duration</span>
                        <span className="text-muted-foreground">
                          {formatTime(timers.hidden)}
                        </span>
                      </Label>
                      <Slider
                        value={[timers.hidden]}
                        onValueChange={value =>
                          handleTimerChange('hidden', value)
                        }
                        max={10000}
                        min={500}
                        step={500}
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        How long to hide the word (thinking time)
                      </p>
                    </div>

                    {/* Translated Duration */}
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm font-medium">
                        <span>Translation Duration</span>
                        <span className="text-muted-foreground">
                          {formatTime(timers.translated)}
                        </span>
                      </Label>
                      <Slider
                        value={[timers.translated]}
                        onValueChange={value =>
                          handleTimerChange('translated', value)
                        }
                        max={10000}
                        min={500}
                        step={500}
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        How long to show the translation
                      </p>
                    </div>

                    {/* Pause Duration */}
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm font-medium">
                        <span>Pause Duration</span>
                        <span className="text-muted-foreground">
                          {formatTime(timers.pause)}
                        </span>
                      </Label>
                      <Slider
                        value={[timers.pause]}
                        onValueChange={value =>
                          handleTimerChange('pause', value)
                        }
                        max={5000}
                        min={0}
                        step={500}
                        className="w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        Pause between cards
                      </p>
                    </div>

                    <div className="border-none pt-2">
                      <p className="text-muted-foreground text-center text-xs">
                        Total cycle: {formatTime(TOTAL_DURATION)}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {componentState === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-lg">Loading {selectedLimit} flashcards...</p>
            </div>
          )}

          {componentState === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-lg text-red-600">Error: {error}</p>
              <Button onClick={handleRestart}>Try Again</Button>
            </div>
          )}

          {componentState === 'empty' && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-lg">No flashcards found</p>
              <p className="text-muted-foreground text-sm">
                Try translating some words first!
              </p>
              <Button onClick={handleRestart}>Back to Selection</Button>
            </div>
          )}

          {componentState === 'running' && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="bg-secondary relative h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full w-full flex-1 bg-gray-300 transition-all"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  Card {currentIndex + 1} of {flashcards.length}
                </p>
              </div>

              {/* Current flashcard */}
              <div className="flex min-h-[120px] items-center justify-center">
                {renderCardContent()}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePause}>
                  Pause
                </Button>
              </div>
            </div>
          )}

          {componentState === 'paused' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Paused</h2>
                <p className="text-muted-foreground">
                  Card {currentIndex + 1} of {flashcards.length}
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  variant="default"
                  onClick={handleResume}>
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Selection
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
