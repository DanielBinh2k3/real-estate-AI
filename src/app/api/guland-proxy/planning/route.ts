import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient, LocationRequest } from '@/lib/guland-api-client';

export async function POST(request: NextRequest) {
  try {
    const body: LocationRequest = await request.json();

    // Validate required fields
    if (!body.marker_lat || !body.marker_lng || !body.province_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: marker_lat, marker_lng, province_id' 
        },
        { status: 400 }
      );
    }

    // Call FastAPI server
    const result = await gulandApiClient.getPlanningData(body);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Planning API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 