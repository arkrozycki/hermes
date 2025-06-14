import { AuthRequest, AuthResponse } from "../types/auth";
import { apiService } from "./apiService";

class AuthService {
  private tokens: AuthResponse | null = null;

  constructor() {
    // Load tokens on initialization
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      const storedTokens = await window.electron?.invoke('get-tokens');
      if (storedTokens) {
        this.tokens = storedTokens;
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(tokens: AuthResponse) {
    try {
      await window.electron?.invoke('store-tokens', tokens);
      this.tokens = tokens;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  async login(request: AuthRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>("/auth/login", request);
      await this.saveTokens(response);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async register(request: AuthRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>("/auth/register", request);
      await this.saveTokens(response);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  getTokens(): AuthResponse | null {
    return this.tokens;
  }

  clearTokens() {
    this.tokens = null;
    window.electron?.invoke('store-tokens', null);
  }
}

export const authService = new AuthService(); 