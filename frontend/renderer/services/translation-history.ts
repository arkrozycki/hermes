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

export async function getTranslationHistory(page: number, limit: number): Promise<TranslationHistoryResponse> {
  return apiClient<TranslationHistoryResponse>(`/translations/history?page=${page}&limit=${limit}`)
} 