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
  is_loading?: boolean
}

interface HistoryProps {
  translations: TranslationHistory[]
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  onUpdateTranslation: (id: number, outputText: string) => Promise<void>
  onDeleteTranslation: (id: number) => Promise<void>
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1 min-h-[60px]">
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  )
}

export function History({ 
  translations, 
  onLoadMore, 
  hasMore, 
  isLoading, 
  onUpdateTranslation, 
  onDeleteTranslation
}: HistoryProps) {
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editText, setEditText] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState<number | null>(null)
  const { toast } = useToast()
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const prevTranslationsLengthRef = React.useRef(translations.length)

  // Scroll to bottom on new messages, initial load, or when typing indicator appears
  React.useEffect(() => {
    const isNewMessage = translations.length > prevTranslationsLengthRef.current
    if (isNewMessage || translations.length === 1) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }
    prevTranslationsLengthRef.current = translations.length
  }, [translations])

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
      <ScrollArea className="flex-1 rounded-lg border bg-muted/50">
        <div className="flex flex-col gap-4 p-4">
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-32"
              >
                {isLoading ? 'Loading...' : 'Load Previous'}
              </Button>
            </div>
          )}
          {[...translations].reverse().map((translation) => (
            <div key={translation.id} className="flex flex-col gap-2">
              <div className="group relative max-w-[80%] min-w-[200px] self-end rounded-lg border bg-card p-3 shadow-sm">
                {/* Source text */}
                <div className="mb-2 border-b pb-2">
                  <div className="text-sm text-muted-foreground">
                    {translation.input_text}
                  </div>
                </div>
                {/* Target text */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {translation.is_loading ? (
                      <div className="text-sm min-h-[60px] flex items-center justify-end bg-muted/20 rounded-md">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <span className="text-xs text-muted-foreground"></span>
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                          </div>
                        </div>
                      </div>
                    ) : editingId === translation.id ? (
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] resize-none"
                        disabled={isUpdating}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm min-h-[60px] flex items-center justify-end">
                        {translation.output_text}
                      </div>
                    )}
                  </div>
                  {!translation.is_loading && (
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
                  )}
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
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
} 