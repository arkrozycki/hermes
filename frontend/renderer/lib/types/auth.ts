export interface User {
  id: number
  username: string
  email: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  message: string
  status: number
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
} 