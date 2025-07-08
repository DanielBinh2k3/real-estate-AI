import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient, RoadPointsRequest } from '@/lib/guland-api-client';

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

    const params: RoadPointsRequest = {
      lat,
      lng,
      lat_ne,
      lng_ne,
      lat_sw,
      lng_sw
    };

    // Call FastAPI server
    const result = await gulandApiClient.getRoadPoints(params);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Road-points API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 