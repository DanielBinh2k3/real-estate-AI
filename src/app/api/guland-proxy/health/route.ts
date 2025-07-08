import { NextRequest, NextResponse } from 'next/server';
import { gulandApiClient } from '@/lib/guland-api-client';

export async function GET(request: NextRequest) {
  try {
    // Call FastAPI server health check
    const result = await gulandApiClient.healthCheck();

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('Health check API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Health check proxy error: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 