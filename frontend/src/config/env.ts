/// <reference types="vite/client" />

export const config = {
    apiUrl: import.meta.env.BACKEND_API_URL || 'http://localhost:3000/api',
} as const;

// Type for our environment variables
declare global {
    interface ImportMetaEnv {
        BACKEND_API_URL: string;
    }
} 