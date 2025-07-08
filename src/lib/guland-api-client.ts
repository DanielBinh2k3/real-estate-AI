import { GULAND_CONFIG } from './config';

/**
 * guland-api-client.ts – API client for Guland FastAPI server
 * ----------------------------------------------------------
 * • Calls FastAPI server instead of guland.vn directly
 * • Includes retry logic and error handling
 * • TypeScript interfaces for all endpoints
 * ----------------------------------------------------------
 */

// Request/Response interfaces
export interface LocationRequest {
  marker_lat: number;
  marker_lng: number;
  province_id: number;
}

export interface GeocodingRequest {
  lat: number;
  lng: number;
  path: string;
}

export interface CheckPlanRequest {
  lat: number;
  lng: number;
  lat_ne: number;
  lng_ne: number;
  lat_sw: number;
  lng_sw: number;
  cid?: string;
  map?: number;
  price?: string;
  type?: string;
  is_check_plan?: number;
  district_id?: string;
  province_id?: string;
  ward_id?: string;
  map_attr?: string;
}

export interface RoadPointsRequest {
  lat: number;
  lng: number;
  lat_ne: number;
  lng_ne: number;
  lat_sw: number;
  lng_sw: number;
}

export interface PricingDataRequest {
  // DataTables pagination
  draw?: number;
  start?: number;
  length?: number;
  
  // Main search parameters (these can be changed in the future)
  district_name?: string;        // columns[1][search][value] - e.g., "hà đông"
  ward_name?: string;           // columns[2][search][value]
  road_name?: string;           // columns[3][search][value] - e.g., "tô hiệu"
  
  // Location filters
  province_id?: string;         // e.g., "01"
  district_id?: string;
  road_id?: string;
  
  // General search
  search_value?: string;        // search[value]
  search_regex?: boolean;       // search[regex]
  
  // Additional timestamp parameter
  timestamp?: string;           // _ parameter for cache busting
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status_code?: number;
  error?: string;
}

export interface GulandApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

// Utility function for API calls with retry logic
async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retries = GULAND_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GULAND_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && !error.name?.includes('AbortError')) {
      console.warn(`API call failed, retrying in ${GULAND_CONFIG.RETRY_DELAY}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, GULAND_CONFIG.RETRY_DELAY));
      return apiCall<T>(url, options, retries - 1);
    }
    
    throw error;
  }
}

// API Client Class
export class GulandApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || GULAND_CONFIG.SERVER_URL;
  }

  /**
   * Health check - Test server connection
   */
  async healthCheck(): Promise<ApiResponse> {
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.HEALTH}`;
    
    try {
      const response = await apiCall<ApiResponse>(url);
      return {
        success: true,
        data: response,
        message: 'Server is healthy'
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get planning data for coordinates
   */
  async getPlanningData(params: LocationRequest): Promise<GulandApiResponse> {
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.GET_PLANNING_DATA}`;
    
    try {
      console.log('🎯 Getting planning data for:', params);
      console.log('🌐 Full API URL:', url);
      
      const response = await apiCall<ApiResponse>(url, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Get planning data error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Geocoding (GET method)
   */
  async geocoding(params: GeocodingRequest): Promise<GulandApiResponse> {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      path: params.path
    });
    
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.GEOCODING}?${searchParams}`;
    
    try {
      console.log('🌍 Getting geocoding data for:', params);
      
      const response = await apiCall<ApiResponse>(url);

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Geocoding error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Geocoding (POST method with CSRF)
   */
  async geocodingPost(params: GeocodingRequest): Promise<GulandApiResponse> {
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.GEOCODING_POST}`;
    
    try {
      console.log('🌍 Getting geocoding POST data for:', params);
      
      const response = await apiCall<ApiResponse>(url, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Geocoding POST error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check planning data for area bounds
   */
  async checkPlan(params: CheckPlanRequest): Promise<GulandApiResponse> {
    const searchParams = new URLSearchParams();
    
    // Add all parameters to search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.CHECK_PLAN}?${searchParams}`;
    
    try {
      console.log('📋 Getting check plan data for bounds:', params);
      
      const response = await apiCall<ApiResponse>(url);

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Check plan error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get road points for area bounds
   */
  async getRoadPoints(params: RoadPointsRequest): Promise<GulandApiResponse> {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      lat_ne: params.lat_ne.toString(),
      lng_ne: params.lng_ne.toString(),
      lat_sw: params.lat_sw.toString(),
      lng_sw: params.lng_sw.toString(),
    });
    
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.ROAD_POINTS}?${searchParams}`;
    
    try {
      console.log('🛣️ Getting road points data for bounds:', params);
      
      const response = await apiCall<ApiResponse>(url);

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Road points error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh CSRF token
   */
  async refreshToken(): Promise<GulandApiResponse> {
    const url = `${this.baseUrl}${GULAND_CONFIG.ENDPOINTS.REFRESH_TOKEN}`;
    
    try {
      console.log('🔄 Refreshing CSRF token...');
      
      const response = await apiCall<ApiResponse>(url, {
        method: 'POST',
      });

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Refresh token error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pricing data with configurable search parameters
   */
  async getPricingData(params: PricingDataRequest): Promise<GulandApiResponse> {
    const searchParams = new URLSearchParams();
    
    // Add all parameters to search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const url = `${GULAND_CONFIG.PROXY_ENDPOINTS.PRICING}?${searchParams}`;
    
    try {
      console.log('🏷️ Getting pricing data for:', params);
      
      const response = await apiCall<ApiResponse>(url);

      return {
        success: response.success,
        data: response.data,
        status: response.status_code
      };
    } catch (error: any) {
      console.error('❌ Pricing data error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Comprehensive method to get bound data with automatic fallback
   */
  async getBound(params: LocationRequest, targetURL?: string): Promise<GulandApiResponse> {
    return this.getPlanningData(params);
  }
}

// Export singleton instance
export const gulandApiClient = new GulandApiClient();

// Export utility functions
export const createGulandApiClient = (baseUrl?: string) => new GulandApiClient(baseUrl);

// Default export
export default GulandApiClient; 