'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Loader2, X, RotateCcw, BookOpen } from 'lucide-react'
import { getFlashcards, type Flashcard } from '@/lib/services/flashcards.service'

interface FlashcardsProps {
  isOpen: boolean
  onClose: () => void
  sourceLang: string
  targetLang: string
  // Configurable timers (in milliseconds)
  sourceDuration?: number
  hiddenDuration?: number
  translatedDuration?: number
  pauseDuration?: number
}

type FlashcardState = 'source' | 'hidden' | 'translated' | 'pause'
type ComponentState = 'selection' | 'loading' | 'running' | 'paused' | 'error' | 'empty'

export function Flashcards({ 
  isOpen, 
  onClose, 
  sourceLang, 
  targetLang, 
  sourceDuration = 1000,      // 1 second for source
  hiddenDuration = 2000,      // 2 seconds hidden
  translatedDuration = 2000,  // 2 seconds for translated
  pauseDuration = 2000        // 2 seconds pause before next word
}: FlashcardsProps) {
  const [flashcards, setFlashcards] = React.useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [componentState, setComponentState] = React.useState<ComponentState>('selection')
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
  
  // Calculate total duration and timing points
  const TOTAL_DURATION = sourceDuration + hiddenDuration + translatedDuration + pauseDuration

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
      console.log('nextCard called:', { next, flashcardsLength: currentFlashcards.length, currentIndex: prev })
      
      if (next >= currentFlashcards.length) {
        console.log('End of flashcards reached')
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
    console.log('startCard called for index:', currentIndex)
    clearTimers()
    setProgress(0)
    setCardState('source')
    
    let startTime = Date.now()
    
    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed / TOTAL_DURATION) * 100
      
      if (newProgress >= 100) {
        setProgress(100)
        return
      }
      
      setProgress(newProgress)
    }, 16) // ~60fps for smooth animation
    
    // Set up phase transitions with separate timeouts
    hiddenTimeoutRef.current = setTimeout(() => {
      setCardState('hidden')
    }, sourceDuration)
    
    translatedTimeoutRef.current = setTimeout(() => {
      setCardState('translated')
    }, sourceDuration + hiddenDuration)
    
    pauseTimeoutRef.current = setTimeout(() => {
      setCardState('pause')
    }, sourceDuration + hiddenDuration + translatedDuration)
    
    // Only one call to nextCard at the end
    intervalRef.current = setTimeout(() => {
      clearTimers()
      console.log('Final timeout reached, calling nextCard')
      nextCard()
    }, TOTAL_DURATION)
    
  }, [clearTimers, TOTAL_DURATION, sourceDuration, hiddenDuration, translatedDuration, nextCard])

  const fetchFlashcardsAndStart = React.useCallback(async (limit: number) => {
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
      
      console.log('Received flashcards:', response.flashcards.length)
      
      if (response.flashcards.length === 0) {
        setComponentState('empty')
        setFlashcards([])
      } else {
        setFlashcards(response.flashcards)
        setCurrentIndex(0)
        setProgress(0)
        setCardState('source')
        setComponentState('running')
        
        console.log('Starting flashcards, total:', response.flashcards.length)
        
        // Auto-start immediately after loading
        setTimeout(() => {
          startCard()
        }, 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flashcards')
      setComponentState('error')
    }
  }, [sourceLang, targetLang, startCard])

  const handleClose = React.useCallback(() => {
    clearTimers()
    setComponentState('selection')
    setProgress(0)
    setFlashcards([])
    setCurrentIndex(0)
    setError(null)
    setCardState('source')
    setSelectedLimit(10)
    onClose()
  }, [onClose, clearTimers])

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
    console.log('useEffect triggered:', { componentState, flashcardsLength: flashcards.length, currentIndex })
    if (componentState === 'running' && flashcards.length > 0 && currentIndex > 0) {
      console.log('Auto-starting next card')
      startCard()
    }
  }, [currentIndex, componentState, flashcards.length, startCard])

  // Reset to selection when component opens
  React.useEffect(() => {
    if (isOpen) {
      setComponentState('selection')
      setFlashcards([])
      setCurrentIndex(0)
      setProgress(0)
      setCardState('source')
      setError(null)
    }
  }, [isOpen])

  // Cleanup intervals on unmount
  React.useEffect(() => {
    return clearTimers
  }, [clearTimers])

  if (!isOpen) return null

  const currentCard = flashcards[currentIndex]

  const renderCardContent = () => {
    if (!currentCard) return null

    switch (cardState) {
      case 'source':
        return (
          <div className="text-4xl font-bold text-primary">
            {currentCard.source_text}
          </div>
        )
      case 'hidden':
        return (
          <div className="text-4xl font-bold text-muted-foreground/30">
            • • •
          </div>
        )
      case 'translated':
        return (
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {currentCard.translated_text}
            </div>
          </div>
        )
      case 'pause':
        return (
          <div className="text-4xl font-bold text-muted-foreground/10">
            &nbsp;
          </div>
        )
      default:
        return null
    }
  }

  const limitOptions = [5, 10, 25, 50]

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white hover:bg-opacity-20"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </Button>

        <Card className="p-8 text-center">
          {componentState === 'selection' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Start Flashcards</h2>
              </div>
              
              <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                {limitOptions.map((limit) => (
                  <Button
                    key={limit}
                    variant="outline"
                    size="lg"
                    className="h-16 text-lg font-semibold"
                    onClick={() => fetchFlashcardsAndStart(limit)}
                  >
                    {limit}
                  </Button>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {sourceLang} → {targetLang}
              </p>
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
              <Button onClick={handleRestart}>
                Try Again
              </Button>
            </div>
          )}

          {componentState === 'empty' && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-lg">No flashcards found</p>
              <p className="text-sm text-muted-foreground">
                Try translating some words first!
              </p>
              <Button onClick={handleRestart}>
                Back to Selection
              </Button>
            </div>
          )}

          {componentState === 'running' && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className="h-full w-full flex-1 bg-gray-300 transition-all"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Card {currentIndex + 1} of {flashcards.length}
                </p>
              </div>

              {/* Current flashcard */}
              <div className="min-h-[120px] flex items-center justify-center">
                {renderCardContent()}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePause}
                >
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
                  onClick={handleResume}
                >
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRestart}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
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