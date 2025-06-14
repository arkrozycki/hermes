import { apiService } from './apiService';

interface RegistrationResponse {
    success: boolean;
    token?: string;
    error?: string;
}

interface AuthRequest {
    email: string;
    password: string;
}

class SettingService {
    private static readonly TOKEN_KEY = 'jwt_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

    // Register with email
    async registerEmail(request: AuthRequest): Promise<RegistrationResponse> {
        try {
            const response = await apiService.authenticateEmail(request);
            if (response.token) {
                this.saveToken(response.token);
                return { success: true, token: response.token };
            }
            return { success: false, error: "No token received from server" };
        } catch (error) {
            console.error('Error registering email:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "An unknown error occurred" 
            };
        }
    }

    // Directly save a JWT token
    saveToken(token: string): void {
        localStorage.setItem(SettingService.TOKEN_KEY, token);
    }

    // Get the stored JWT token
    getToken(): string | null {
        return localStorage.getItem(SettingService.TOKEN_KEY);
    }

    // Save refresh token
    saveRefreshToken(token: string): void {
        localStorage.setItem(SettingService.REFRESH_TOKEN_KEY, token);
    }

    // Get refresh token
    getRefreshToken(): string | null {
        return localStorage.getItem(SettingService.REFRESH_TOKEN_KEY);
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = this.getToken();
        return !!token;
    }

    // Clear authentication
    logout(): void {
        localStorage.removeItem(SettingService.TOKEN_KEY);
        localStorage.removeItem(SettingService.REFRESH_TOKEN_KEY);
    }
}

export const settingService = new SettingService();
