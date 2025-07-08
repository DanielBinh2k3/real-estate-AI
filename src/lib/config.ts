// API Configuration from Environment Variables
export const config = {
  // Resta.vn API Configuration
  resta: {
    // Current token (used in client components and API routes)
    authToken: process.env.RESTA_AUTH_TOKEN
  },

  // Geoapify API Configuration
  geoapify: {
    apiKey: process.env.GEOAPIFY_API_KEY
  },

  // Perplexity AI API Configuration
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY
  },

  // Jina AI API Configuration (deprecated, kept for legacy support)
  jina: {
    apiKey: process.env.JINA_API_KEY
  }
};

// Client-side configuration (for Next.js public env vars)
export const clientConfig = {
  resta: {
    authToken: process.env.NEXT_PUBLIC_RESTA_AUTH_TOKEN
  },
  geoapify: {
    apiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
  }
};

// Helper function to get auth token for demos (throws error if not set)
export const getDefaultAuthToken = () => {
  const token = clientConfig.resta.authToken;
  if (!token) {
    throw new Error('NEXT_PUBLIC_RESTA_AUTH_TOKEN is not set in environment variables');
  }
  return token;
};

// Helper function to get Geoapify API key (throws error if not set)
export const getGeoapifyApiKey = () => {
  const apiKey = clientConfig.geoapify.apiKey;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEOAPIFY_API_KEY is not set in environment variables');
  }
  return apiKey;
};

// Helper function to get Perplexity API key (throws error if not set)
export const getPerplexityApiKey = () => {
  const apiKey = config.perplexity.apiKey;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not set in environment variables');
  }
  return apiKey;
};

// Helper function to get Jina API key (throws error if not set)
export const getJinaApiKey = () => {
  const apiKey = config.jina.apiKey;
  if (!apiKey) {
    throw new Error('JINA_API_KEY is not set in environment variables');
  }
  return apiKey;
};

// Guland Server Configuration
export const GULAND_CONFIG = {
  SERVER_URL: process.env.NEXT_PUBLIC_GULAND_SERVER_URL || 'http://localhost:8000',
  ENDPOINTS: {
    GET_PLANNING_DATA: '/get-planning-data',
    GEOCODING: '/geocoding',
    CHECK_PLAN: '/check-plan',
    ROAD_POINTS: '/road-points',
    GEOCODING_POST: '/geocoding-post',
    REFRESH_TOKEN: '/refresh-token',
    HEALTH: '/health'
  },
  PROXY_ENDPOINTS: {
    HEALTH: '/api/guland-proxy/health',
    PLANNING: '/api/guland-proxy/planning',
    GEOCODING: '/api/guland-proxy/geocoding',
    CHECK_PLAN: '/api/guland-proxy/check-plan',
    ROAD_POINTS: '/api/guland-proxy/road-points',
    REFRESH_TOKEN: '/api/guland-proxy/refresh-token',
    PRICING: '/api/guland-proxy/pricing'
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};