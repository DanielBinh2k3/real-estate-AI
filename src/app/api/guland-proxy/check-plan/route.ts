import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient, CheckPlanRequest } from '@/lib/guland-api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const lat_ne = parseFloat(searchParams.get('lat_ne') || '');
    const lng_ne = parseFloat(searchParams.get('lng_ne') || '');
    const lat_sw = parseFloat(searchParams.get('lat_sw') || '');
    const lng_sw = parseFloat(searchParams.get('lng_sw') || '');

    // Validate required fields
    if (isNaN(lat) || isNaN(lng) || isNaN(lat_ne) || isNaN(lng_ne) || isNaN(lat_sw) || isNaN(lng_sw)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid required parameters: lat, lng, lat_ne, lng_ne, lat_sw, lng_sw' 
        },
        { status: 400 }
      );
    }

    const params: CheckPlanRequest = {
      lat,
      lng,
      lat_ne,
      lng_ne,
      lat_sw,
      lng_sw,
      cid: searchParams.get('cid') || '',
      map: parseInt(searchParams.get('map') || '1'),
      price: searchParams.get('price') || '',
      type: searchParams.get('type') || '',
      is_check_plan: parseInt(searchParams.get('is_check_plan') || '0'),
      district_id: searchParams.get('district_id') || '',
      province_id: searchParams.get('province_id') || '01',
      ward_id: searchParams.get('ward_id') || '',
      map_attr: searchParams.get('map_attr') || 'type-map-filter%255B%255D%3Dhouse%26type-map-filter%255B%255D%3Dland%26Radio-SqhPriceType%3Don%26status-day%255B%255D%3D1%26status-day%255B%255D%3D2%26status-day%255B%255D%3D3%26size-filter%255B%255D%3D1%26size-filter%255B%255D%3D2%26size-filter%255B%255D%3D3%26size-filter%255B%255D%3D4%26price-filter%255B%255D%3D0-300%26price-filter%255B%255D%3D0-500%26price-filter%255B%255D%3D0-700%26price-filter%255B%255D%3D0-1000%26price-filter%255B%255D%3D1000-2000%26price-filter%255B%255D%3D2000-3000%26price-filter%255B%255D%3D3000-5000%26price-filter%255B%255D%3D5000-7000%26price-filter%255B%255D%3D7000-10000%26price-filter%255B%255D%3D10000-20000%26price-filter%255B%255D%3D20000-30000%26price-filter%255B%255D%3D30000-1000000'
    };

    // Call FastAPI server
    const result = await gulandApiClient.checkPlan(params);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Check-plan API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 