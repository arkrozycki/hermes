import axios, { AxiosInstance, AxiosError } from 'axios';
import { settingService } from './settingService';

interface AuthResponse {
    token: string;
}

interface AuthRequest {
    email: string;
    password: string;
}

interface TranslationResponse {
    translated_text: string;
}

interface TranslationRequest {
    text: string;
    source_language: string;
    target_language: string;
}

class ApiService {
    private static readonly API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000/api';
    private axiosInstance: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value?: unknown) => void;
        reject: (reason?: any) => void;
    }> = [];

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: ApiService.API_URL
        });

        // Add request interceptor to automatically add the token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = settingService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor to handle token refresh
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config;
                if (!originalRequest) {
                    return Promise.reject(error);
                }

                // If the error is not 401 or we're already refreshing, reject
                if (error.response?.status !== 401 || this.isRefreshing) {
                    return Promise.reject(error);
                }

                // If we're not already refreshing, start the refresh process
                if (!this.isRefreshing) {
                    this.isRefreshing = true;

                    try {
                        // Try to refresh the token
                        const response = await this.refreshToken();
                        const newToken = response.token;
                        settingService.saveToken(newToken);

                        // Retry all queued requests
                        this.failedQueue.forEach((prom) => {
                            prom.resolve();
                        });
                    } catch (refreshError) {
                        // If refresh fails, reject all queued requests
                        this.failedQueue.forEach((prom) => {
                            prom.reject(refreshError);
                        });
                        // Logout the user
                        settingService.logout();
                        window.location.reload();
                    } finally {
                        this.isRefreshing = false;
                        this.failedQueue = [];
                    }
                }

                // Add the request to the queue
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        // Retry the original request
                        return this.axiosInstance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }
        );

        // Log the API URL being used (remove in production)
        console.log('API URL:', ApiService.API_URL);
    }

    // Register/authenticate with email
    async authenticateEmail(request: AuthRequest): Promise<AuthResponse> {
        const response = await this.axiosInstance.post<AuthResponse>('/auth/register', request);
        return response.data;
    }

    // Refresh the token
    async refreshToken(): Promise<AuthResponse> {
        const response = await this.axiosInstance.post<AuthResponse>('/token/refresh');
        return response.data;
    }

    // Translate text using the backend service
    async translateText(request: TranslationRequest): Promise<TranslationResponse> {
        const response = await this.axiosInstance.post<TranslationResponse>('/translate', request);
        return response.data;
    }

    // Example of a protected endpoint call
    async getProtectedData() {
        const response = await this.axiosInstance.get('/protected-endpoint');
        return response.data;
    }

    // Add more API methods here as needed
}

export const apiService = new ApiService(); 