import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient, GeocodingRequest } from '@/lib/guland-api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const path = searchParams.get('path') || '';

    // Validate required fields
    if (isNaN(lat) || isNaN(lng) || !path) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid required parameters: lat, lng, path' 
        },
        { status: 400 }
      );
    }

    const params: GeocodingRequest = { lat, lng, path };

    // Call FastAPI server
    const result = await gulandApiClient.geocoding(params);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Geocoding API proxy error:', error);
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
    const body: GeocodingRequest = await request.json();

    // Validate required fields
    if (!body.lat || !body.lng || !body.path) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: lat, lng, path' 
        },
        { status: 400 }
      );
    }

    // Call FastAPI server (POST method)
    const result = await gulandApiClient.geocodingPost(body);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Geocoding POST API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 