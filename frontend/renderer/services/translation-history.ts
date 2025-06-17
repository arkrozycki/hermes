import { apiClient } from '@/lib/api-client'
import { TranslationHistory } from '@/components/history'

interface PaginationInfo {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
}

interface TranslationHistoryResponse {
  translations: TranslationHistory[]
  pagination: PaginationInfo
}

interface UpdateTranslationRequest {
  output_text: string
}

export async function getTranslationHistory(page: number, limit: number): Promise<TranslationHistoryResponse> {
  return apiClient<TranslationHistoryResponse>(`/translations/history?page=${page}&limit=${limit}`)
}

export async function updateTranslation(id: number, data: UpdateTranslationRequest): Promise<TranslationHistory> {
  return apiClient<TranslationHistory>(`/translations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
} 