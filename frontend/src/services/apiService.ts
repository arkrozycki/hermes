import axios, { AxiosInstance } from 'axios';
import { settingService } from './settingService';

interface AuthResponse {
    token: string;
}

class ApiService {
    private static readonly API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000/api';
    private axiosInstance: AxiosInstance;

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

        // Log the API URL being used (remove in production)
        console.log('API URL:', ApiService.API_URL);
    }

    // Register/authenticate with email
    async authenticateEmail(email: string): Promise<AuthResponse> {
        const response = await this.axiosInstance.post<AuthResponse>('/auth/register', { email });
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