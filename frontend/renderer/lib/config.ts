const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  isAuthEnabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
}

export default config 