import { authService } from './services/auth.service'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiErrorException extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiErrorException'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = authService.getAccessToken()
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)

    // If we get a 401 and have a refresh token, try to refresh
    if (response.status === 401 && authService.getRefreshToken()) {
      try {
        await authService.refreshAccessToken()
        // Retry the original request with the new token
        return apiClient<T>(endpoint, options)
      } catch (refreshError) {
        // If refresh fails, clear auth and throw
        await authService.logout()
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }))
      throw new Error(error.message || 'An error occurred')
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An error occurred')
  }
} 