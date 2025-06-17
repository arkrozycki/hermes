import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronDown, Edit2, Check, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

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
}

export function History({ translations, onLoadMore, hasMore, isLoading, onUpdateTranslation }: HistoryProps) {
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editText, setEditText] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)

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

  return (
    <div className="flex flex-col gap-2">
      <ScrollArea className="p-4">
        <div className="flex flex-col gap-2">
          {translations.map((translation) => (
            <div
              key={translation.id}
              className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    {translation.source_language} → {translation.target_language}
                  </span>
                  {translation.was_cached && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      cached
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>{new Date(translation.timestamp).toLocaleString()}</span>
                  {editingId === translation.id ? (
                    <div className="flex items-center gap-1">
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
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(translation)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="font-medium">{translation.input_text}</div>
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
                <div className="text-muted-foreground">{translation.output_text}</div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoading}
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Load More <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  )
} 