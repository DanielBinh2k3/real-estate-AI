import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from query string
    const params: PricingDataRequest = {
      draw: searchParams.get('draw') ? parseInt(searchParams.get('draw')!) : 1,
      start: searchParams.get('start') ? parseInt(searchParams.get('start')!) : 0,
      length: searchParams.get('length') ? parseInt(searchParams.get('length')!) : 50,
      
      // Configurable search parameters
      district_name: searchParams.get('district_name') || searchParams.get('columns[1][search][value]') || '',
      ward_name: searchParams.get('ward_name') || searchParams.get('columns[2][search][value]') || '',
      road_name: searchParams.get('road_name') || searchParams.get('columns[3][search][value]') || '',
      
      // Location filters
      province_id: searchParams.get('province_id') || '01',
      district_id: searchParams.get('district_id') || '',
      road_id: searchParams.get('road_id') || '',
      
      // General search
      search_value: searchParams.get('search[value]') || searchParams.get('search_value') || '',
      search_regex: searchParams.get('search[regex]') === 'true',
      
      // Timestamp for cache busting
      timestamp: searchParams.get('_') || Date.now().toString(),
    };

    // Build the DataTables query string for guland.vn
    const queryParams = new URLSearchParams();
    
    // DataTables structure
    queryParams.append('draw', params.draw!.toString());
    queryParams.append('start', params.start!.toString());
    queryParams.append('length', params.length!.toString());
    
    // Column definitions (required by DataTables)
    const columns = [
      'id', 'district_name', 'ward_name', 'road_name', 
      'vt1', 'vt2', 'vt3', 'vt4', 'vt5', 'type'
    ];
    
    columns.forEach((col, index) => {
      queryParams.append(`columns[${index}][data]`, col);
      queryParams.append(`columns[${index}][name]`, col);
      queryParams.append(`columns[${index}][searchable]`, 'true');
      queryParams.append(`columns[${index}][orderable]`, 'true');
      queryParams.append(`columns[${index}][search][regex]`, 'false');
      
      // Set search values for specific columns
      let searchValue = '';
      if (col === 'district_name' && params.district_name) {
        searchValue = params.district_name;
      } else if (col === 'ward_name' && params.ward_name) {
        searchValue = params.ward_name;
      } else if (col === 'road_name' && params.road_name) {
        searchValue = params.road_name;
      }
      
      queryParams.append(`columns[${index}][search][value]`, searchValue);
    });
    
    // Global search
    queryParams.append('search[value]', params.search_value || '');
    queryParams.append('search[regex]', params.search_regex ? 'true' : 'false');
    
    // Location parameters
    queryParams.append('province_id', params.province_id!);
    if (params.district_id) {
      queryParams.append('district_id', params.district_id);
    }
    if (params.road_id) {
      queryParams.append('road_id', params.road_id);
    }
    
    // Timestamp for cache busting
    queryParams.append('_', params.timestamp!);

    // Make request to guland.vn
    const gulandUrl = `https://guland.vn/seo/pricing.data?${queryParams.toString()}`;
    
    console.log('🏷️ Fetching pricing data from:', gulandUrl);
    
    const response = await fetch(gulandUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://guland.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      params: params // Return the processed parameters for debugging
    });

  } catch (error: any) {
    console.error('Pricing API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PricingDataRequest = await request.json();
    
    // Build the DataTables query string for guland.vn (same logic as GET)
    const queryParams = new URLSearchParams();
    
    // DataTables structure
    queryParams.append('draw', (body.draw || 1).toString());
    queryParams.append('start', (body.start || 0).toString());
    queryParams.append('length', (body.length || 50).toString());
    
    // Column definitions
    const columns = [
      'id', 'district_name', 'ward_name', 'road_name', 
      'vt1', 'vt2', 'vt3', 'vt4', 'vt5', 'type'
    ];
    
    columns.forEach((col, index) => {
      queryParams.append(`columns[${index}][data]`, col);
      queryParams.append(`columns[${index}][name]`, col);
      queryParams.append(`columns[${index}][searchable]`, 'true');
      queryParams.append(`columns[${index}][orderable]`, 'true');
      queryParams.append(`columns[${index}][search][regex]`, 'false');
      
      let searchValue = '';
      if (col === 'district_name' && body.district_name) {
        searchValue = body.district_name;
      } else if (col === 'ward_name' && body.ward_name) {
        searchValue = body.ward_name;
      } else if (col === 'road_name' && body.road_name) {
        searchValue = body.road_name;
      }
      
      queryParams.append(`columns[${index}][search][value]`, searchValue);
    });
    
    // Global search
    queryParams.append('search[value]', body.search_value || '');
    queryParams.append('search[regex]', body.search_regex ? 'true' : 'false');
    
    // Location parameters
    queryParams.append('province_id', body.province_id || '01');
    if (body.district_id) {
      queryParams.append('district_id', body.district_id);
    }
    if (body.road_id) {
      queryParams.append('road_id', body.road_id);
    }
    
    // Timestamp
    queryParams.append('_', body.timestamp || Date.now().toString());

    // Make request to guland.vn
    const gulandUrl = `https://guland.vn/seo/pricing.data?${queryParams.toString()}`;
    
    console.log('🏷️ Fetching pricing data (POST) from:', gulandUrl);
    
    const response = await fetch(gulandUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://guland.vn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      params: body // Return the processed parameters for debugging
    });

  } catch (error: any) {
    console.error('Pricing API proxy (POST) error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 