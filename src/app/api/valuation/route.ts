import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('⚠️  DEPRECATED: /api/valuation endpoint is deprecated');
    console.log('🔄 Redirecting to new AI-powered property valuation');

    const body = await request.json();
    const { payload, auth_token } = body;

    if (!payload) {
      return NextResponse.json(
        { error: 'Valuation payload is required' },
        { status: 400 }
      );
    }

    // Extract coordinates from payload
    const latitude = payload.geoLocation?.[1] || 21.0278;  // Default to Hanoi
    const longitude = payload.geoLocation?.[0] || 105.8342;

    // Convert payload to property_details format
    const property_details = {
      type: payload.type || 'NORMAL',
      landArea: payload.landArea,
      houseArea: payload.houseArea,
      laneWidth: payload.laneWidth,
      facadeWidth: payload.facadeWidth,
      storyNumber: payload.storyNumber,
      bedRoom: payload.bedRoom,
      bathRoom: payload.bathRoom,
      legal: payload.legal,
    };

    console.log('🚀 Calling new AI property valuation API...');
    console.log('📍 Coordinates:', [latitude, longitude]);
    console.log('🏠 Property details:', property_details);

    // Call new AI property valuation API
    const aiValuationUrl = `${request.nextUrl.origin}/api/property-valuation`;
    const aiValuationResponse = await fetch(aiValuationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
        property_details,
        auth_token: auth_token || 'migrated_token'
      }),
    });

    if (!aiValuationResponse.ok) {
      console.log('❌ AI valuation API failed');
      return NextResponse.json(
        { error: 'AI valuation failed' },
        { status: 500 }
      );
    }

    const aiResult = await aiValuationResponse.json();
    console.log('✅ AI valuation completed successfully!');

    // Return result in compatible format
    return NextResponse.json({
      success: true,
      valuation_result: aiResult.result,
      migrated: true,
      message: 'This endpoint has been migrated to AI-powered valuation',
      new_endpoint: '/api/property-valuation',
      performance: aiResult.performance
    });

  } catch (error) {
    console.error('❌ Error during valuation migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform property valuation',
        migrated: true,
        message: 'Legacy endpoint failed, please use /api/property-valuation'
      },
      { status: 500 }
    );
  }
} 