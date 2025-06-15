const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  isAuthEnabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
}

export default config 