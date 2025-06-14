export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
} 