import { apiClient } from '../api-client'
import { LoginCredentials, LoginResponse, RegisterData, RegisterResponse, User } from '../types/auth'

class AuthService {
  private static instance: AuthService
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private user: User | null = null
  private refreshPromise: Promise<void> | null = null

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
      const userStr = localStorage.getItem('user')
      if (userStr) {
        this.user = JSON.parse(userStr)
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private setAuthData(tokens: { access: string; refresh: string }) {
    this.accessToken = tokens.access
    this.refreshToken = tokens.refresh
    localStorage.setItem('accessToken', tokens.access)
    localStorage.setItem('refreshToken', tokens.refresh)
  }

  private clearAuthData() {
    this.accessToken = null
    this.refreshToken = null
    this.user = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  private forceRedirectToLogin() {
    if (typeof window !== 'undefined') {
      // Force redirect by replacing the current history entry
      window.location.replace('/login')
    }
  }

  public async login(credentials: LoginCredentials): Promise<void> {
    const response = await apiClient<LoginResponse>('/token', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    this.setAuthData(response)
  }

  public async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response
  }

  public async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      await apiClient('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuthData()
      this.forceRedirectToLogin()
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) return null

    try {
      const response = await apiClient<{ user: User }>('/auth/me')
      this.user = response.user
      return response.user
    } catch {
      this.clearAuthData()
      this.forceRedirectToLogin()
      return null
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && !!this.refreshToken
  }

  public getUser(): User | null {
    return this.user
  }

  public getAccessToken(): string | null {
    return this.accessToken
  }

  public getRefreshToken(): string | null {
    return this.refreshToken
  }

  public async refreshAccessToken(): Promise<void> {
    const refreshToken = this.refreshToken
    if (!refreshToken) {
      this.clearAuthData()
      this.forceRedirectToLogin()
      throw new Error('No refresh token available')
    }

    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        // Make a direct fetch call for refresh to avoid circular dependency
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/token/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (!response.ok) {
          throw new Error('Failed to refresh token')
        }

        const data = await response.json()
        this.setAuthData(data)
      } catch (error) {
        this.clearAuthData()
        this.forceRedirectToLogin()
        throw error
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }
}

export const authService = AuthService.getInstance() 