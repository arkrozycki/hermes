import { authService } from './services/auth.service'
import config from './config'

const API_URL = config.apiUrl

export class ApiErrorException extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
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

  // Add authorization header for all requests except token endpoints
  if (accessToken && !endpoint.includes('/token')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)

    // Handle 401 errors
    if (response.status === 401) {
      // Don't try to refresh if we're already on a token endpoint
      if (endpoint.includes('/token')) {
        await authService.logout()
        throw new Error('Authentication failed')
      }

      const refreshToken = authService.getRefreshToken()
      if (!refreshToken) {
        await authService.logout()
        throw new Error('No refresh token available')
      }

      try {
        await authService.refreshAccessToken()
        // Retry the original request with the new token
        return apiClient<T>(endpoint, options)
      } catch {
        await authService.logout()
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An error occurred' };
      }
      
      throw new ApiErrorException(
        errorData.message || 'An error occurred',
        response.status,
        errorData
      );
    }

    const data = await response.json()
    return {
      ...data,
      status: response.status
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An error occurred')
  }
} 