import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Edit2, Check, X, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils'

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
  const prevFirstTranslationIdRef = React.useRef<number | null>(
    translations[0]?.id || null
  )

  // Scroll to bottom only on new messages (not when loading previous history)
  React.useEffect(() => {
    const currentFirstId = translations[0]?.id || null
    const isNewMessage =
      translations.length > prevTranslationsLengthRef.current &&
      currentFirstId !== prevFirstTranslationIdRef.current

    if (isNewMessage || translations.length === 1) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    }

    prevTranslationsLengthRef.current = translations.length
    prevFirstTranslationIdRef.current = currentFirstId
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
    } catch (err) {
      console.error('Failed to update translation:', err)
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
    } catch {
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
    <div className="flex h-full flex-col p-2">
      <ScrollArea className="bg-background bg-muted/50 flex-1 rounded-lg border">
        <div className="flex flex-col gap-4 p-4">
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-32">
                {isLoading ? 'Loading...' : 'Load Previous'}
              </Button>
            </div>
          )}
          {[...translations].reverse().map(translation => (
            <div
              key={translation.id}
              className="flex flex-col gap-2">
              <div className="bg-card group relative min-w-[200px] max-w-[80%] self-end rounded-lg border p-3 shadow-sm">
                {/* Source text with toolbar */}
                <div className="mb-2 flex items-start justify-between gap-2 border-b pb-2">
                  <div className="text-muted-foreground flex-1 text-sm">
                    {translation.input_text}
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
                            disabled={isUpdating}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCancel}
                            disabled={isUpdating}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEdit(translation)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-6 w-6"
                            onClick={() => handleDelete(translation.id)}
                            disabled={isDeleting === translation.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Target text */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {translation.is_loading ? (
                      <div className="bg-muted/20 flex min-h-[60px] items-center justify-end rounded-md text-sm">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <span className="text-muted-foreground text-xs"></span>
                          <div className="flex gap-1">
                            <div className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                            <div className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                            <div className="bg-primary h-2 w-2 animate-bounce rounded-full" />
                          </div>
                        </div>
                      </div>
                    ) : editingId === translation.id ? (
                      <Textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="min-h-[60px] resize-none"
                        disabled={isUpdating}
                        onKeyDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex flex-col items-end text-sm">
                        {(() => {
                          const parts = translation.output_text
                            .split(/[\n,]+/)
                            .map(p => p.trim())
                            .filter(Boolean)

                          if (parts.length === 0) return null

                          return (
                            <>
                              {/* Primary translation */}
                              <span className="font-medium">{parts[0]}</span>
                              {/* Alternate synonyms */}
                              {parts.slice(1).map((alt, idx) => (
                                <span
                                  key={idx}
                                  className="mt-2 block text-xs">
                                  {alt}
                                </span>
                              ))}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                {/* Translation metadata (shown on hover) */}
                <div className="text-muted-foreground mt-2 hidden items-center justify-start text-xs group-hover:flex">
                  {translation.was_cached && (
                    <span className="bg-muted rounded px-1.5 py-0.5 text-[10px]">
                      cached
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span>
                      {translation.source_language} →{' '}
                      {translation.target_language}
                    </span>
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
