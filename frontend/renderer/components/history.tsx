import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Edit2, Check, X, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn, timeAgo } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface TranslationHistory {
  id: number
  source_language: string
  target_language: string
  input_text: string
  output_text: string
  timestamp: string
  was_cached: boolean
}

interface HistoryProps {
  translations: TranslationHistory[]
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  onUpdateTranslation: (id: number, outputText: string) => Promise<void>
  onDeleteTranslation: (id: number) => Promise<void>
}

export function History({ translations, onLoadMore, hasMore, isLoading, onUpdateTranslation, onDeleteTranslation }: HistoryProps) {
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editText, setEditText] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState<number | null>(null)
  const { toast } = useToast()
  const [hasScrolled, setHasScrolled] = React.useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  const lastScrollTopRef = React.useRef(0)
  const prevTranslationsLengthRef = React.useRef(translations.length)
  const isNewMessageRef = React.useRef(false)

  // Handle scroll events for loading history
  React.useEffect(() => {
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const handleScroll = () => {
      const currentScrollTop = viewport.scrollTop
      
      if (!hasScrolled) {
        setHasScrolled(true)
      }

      // Only load more if we've scrolled up and are near the top
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current
      if (hasScrolled && isScrollingUp && currentScrollTop < 100 && hasMore && !isLoading && !isLoadingHistory) {
        setIsLoadingHistory(true)
        onLoadMore()
      }

      lastScrollTopRef.current = currentScrollTop
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, onLoadMore, hasScrolled, isLoadingHistory])

  // Handle loading state changes
  React.useEffect(() => {
    if (!isLoading && isLoadingHistory) {
      setIsLoadingHistory(false)
    }
  }, [isLoading, isLoadingHistory])

  // Handle scroll behavior for new messages and initial load
  React.useEffect(() => {
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const isNewMessage = translations.length > prevTranslationsLengthRef.current
    const shouldScrollToBottom = (isNewMessage && !isLoadingHistory) || !hasScrolled

    if (shouldScrollToBottom) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        })
        lastScrollTopRef.current = viewport.scrollHeight
      })
    }

    prevTranslationsLengthRef.current = translations.length
  }, [translations, hasScrolled, isLoadingHistory])

  const handleEdit = (translation: TranslationHistory) => {
    setEditingId(translation.id)
    setEditText(translation.output_text)
  }

  const handleSave = async () => {
    if (!editingId) return
    
    try {
      setIsUpdating(true)
      await onUpdateTranslation(editingId, editText)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update translation:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id)
      await onDeleteTranslation(id)
      toast({
        title: 'Success',
        description: 'Translation deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete translation',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 bg-muted/50 rounded-b-lg">
        <div className="flex flex-col gap-4 p-4">
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {[...translations].reverse().map((translation) => (
            <div key={translation.id} className="flex flex-col gap-2">
              <div className="group relative max-w-[80%] self-end rounded-lg border bg-card p-3 shadow-sm">
                {/* Source text */}
                <div className="mb-2 border-b pb-2">
                  <div className="text-sm text-muted-foreground">
                    {translation.input_text}
                  </div>
                </div>
                {/* Target text */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {editingId === translation.id ? (
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] resize-none"
                        disabled={isUpdating}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm">{translation.output_text}</div>
                    )}
                  </div>
                  <div className="hidden gap-1 group-hover:flex">
                    {editingId === translation.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleSave}
                          disabled={isUpdating}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCancel}
                          disabled={isUpdating}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(translation)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(translation.id)}
                          disabled={isDeleting === translation.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Translation metadata */}
                <div className="mt-2 flex items-center justify-start text-xs text-muted-foreground">
                  {translation.was_cached && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      cached
                    </span>
                  )}
                  <div className="invisible group-hover:visible ml-auto flex items-center gap-2">
                    <span>{translation.source_language} → {translation.target_language}</span>
                    <span>•</span>
                    <span>{timeAgo(translation.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 