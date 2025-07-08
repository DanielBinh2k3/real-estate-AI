import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient } from '@/lib/guland-api-client';

export async function POST(request: NextRequest) {
  try {
    // Call FastAPI server
    const result = await gulandApiClient.refreshToken();

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Refresh token API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 