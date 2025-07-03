import { NextRequest, NextResponse } from 'next/server';
import { propertyAnalysis } from '@/ai/flows/property-analysis';
import { propertyValuationRange } from '@/ai/flows/property-valuation';

interface PropertyDetails {
  type?: string;
  landArea?: number;
  houseArea?: number;
  laneWidth?: number;
  facadeWidth?: number;
  storyNumber?: number;
  bedRoom?: number;
  bathRoom?: number;
  legal?: string;
  yearBuilt?: number;
  utilities?: any;
  amenities?: string[];
  combinedAmenities?: string[];
}

function formatMarketDataForAI(priceTrendData: any): string {
  if (!priceTrendData?.success || !priceTrendData?.data || priceTrendData.data.length === 0) {
    return "Không có dữ liệu thị trường cho khu vực này.";
  }

  const data = priceTrendData.data;
  const latest = data[data.length - 1];
  const earliest = data[0];
  
  const avgPrice = data.reduce((sum: number, item: any) => sum + item.price, 0) / data.length;
  const minPrice = Math.min(...data.map((item: any) => item.minPrice || item.price * 0.7));
  const maxPrice = Math.max(...data.map((item: any) => item.maxPrice || item.price * 1.3));
  
  const trend = latest.price > earliest.price ? "tăng" : "giảm";
  const trendPercent = Math.abs(((latest.price - earliest.price) / earliest.price) * 100).toFixed(1);

  return `
Dữ liệu thị trường bất động sản (${data.length} tháng gần nhất):
- Giá trung bình: ${avgPrice.toFixed(0)} triệu VND/m²
- Khoảng giá: ${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)} triệu VND/m²
- Xu hướng: ${trend} ${trendPercent}% so với ${data.length} tháng trước
- Giá mới nhất (${latest.month}): ${latest.price} triệu VND/m²
- Số lượng giao dịch trung bình: ${(data.reduce((sum: number, item: any) => sum + (item.count ?? 0), 0) / data.length).toFixed(0)} giao dịch/tháng
- Chi tiết từng tháng: ${data.map((item: any) => `${item.month}: ${item.price}M VND/m² (${item.count ?? 'N/A'} giao dịch)`).join(', ')}
  `.trim();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n🤖🔥 ================= AI COMBINED API =================');
  console.log('⚡ Running BOTH AI functions in PARALLEL');

  try {
    const { latitude, longitude, property_details } = await request.json();

    // latitude/longitude are OPTIONAL. If absent or if location lookup fails, we fall back to the
    // city/district/ward provided directly in property_details (or reasonable defaults).

    if (latitude && longitude) {
      console.log(`📍 Coordinates: ${latitude}, ${longitude}`);
    } else {
      console.log('⚠️  No coordinates provided – will skip reverse-geocoding and use fallback address');
    }

    console.log(`🏠 Property details:`, property_details);

    // Step 1: Determine location / parsed address
    console.log('\n📍 STEP 1: Determining location information...');
    const step1Start = Date.now();

    type ParsedAddress = {
      city: string;
      district: string;
      ward: string;
      formatted_address: string;
    };

    let parsedAddress: ParsedAddress = {
      city: property_details?.city || 'ha_noi',
      district: property_details?.district || 'dong_da',
      ward: property_details?.ward || 'unknown',
      formatted_address: property_details?.address || '',
    };

    if (latitude && longitude) {
      try {
        const locationUrl = `${request.nextUrl.origin}/api/location`;
        const locationParams = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
        });

        const locationResponse = await fetch(`${locationUrl}?${locationParams}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          parsedAddress = locationData.parsedAddress as ParsedAddress;
          console.log(`✅ Reverse-geocoding success: ${parsedAddress.formatted_address}`);
        } else {
          console.log('⚠️  Reverse-geocoding failed – using fallback address');
        }
      } catch (locError) {
        console.log('⚠️  Reverse-geocoding exception – using fallback address:', locError);
      }
    }

    console.log(`✅ Parsed address: ${parsedAddress.formatted_address || `${parsedAddress.ward}, ${parsedAddress.district}, ${parsedAddress.city}`}`);
    console.log(`⏱️  Step 1 time: ${Date.now() - step1Start}ms`);

    // Step 2: Get market data from price trend
    console.log('\n📈 STEP 2: Getting market data...');
    const step2Start = Date.now();

    const mapPropertyTypeToCategory = (type: string): string => {
      const categoryMap: Record<string, string> = {
        'apartment': 'chung_cu',
        'lane_house': 'nha_hem_ngo', 
        'town_house': 'nha_mat_pho',
        'land': 'ban_dat',
        'villa': 'biet_thu_lien_ke',
        'NORMAL': 'nha_mat_pho'
      };
      return categoryMap[type] || 'nha_mat_pho';
    };

    const category = mapPropertyTypeToCategory(property_details?.type || 'NORMAL');
    
    const priceTrendUrl = `${request.nextUrl.origin}/api/price-trend`;
    const priceTrendParams = new URLSearchParams({
      city: parsedAddress.city || 'ha_noi',
      district: parsedAddress.district || 'dong_da',
      category: category
    });

    const priceTrendResponse = await fetch(`${priceTrendUrl}?${priceTrendParams}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    let marketData = "Không có dữ liệu thị trường cho khu vực này.";
    if (priceTrendResponse.ok) {
      const priceTrendData = await priceTrendResponse.json();
      if (priceTrendData.success && priceTrendData.data && priceTrendData.data.length > 0) {
        marketData = formatMarketDataForAI(priceTrendData);
        console.log('✅ Market data received');
      } else {
        console.log('⚠️  Price trend API returned no data');
      }
    } else {
      console.log('⚠️  Price trend API failed');
    }

    console.log(`⏱️  Step 2 time: ${Date.now() - step2Start}ms`);

    // Step 3: Prepare shared AI input
    console.log('\n🛠️  STEP 3: Preparing shared AI input...');
    const step3Start = Date.now();

    const defaultDetails = {
      type: 'town_house',
      landArea: 45.0,
      houseArea: 45.0,
      laneWidth: 3.0,
      facadeWidth: 4.0,
      storyNumber: 3.0,
      bedRoom: 2,
      bathRoom: 2,
      legal: 'pink_book',
      yearBuilt: 2015,
    };

    const mergedDetails = { ...defaultDetails, ...property_details };

    // Get amenities from utilities data
    const amenities = mergedDetails.amenities || mergedDetails.combinedAmenities || [];

    const sharedInput = {
      address: parsedAddress.formatted_address || '',
      city: parsedAddress.city || 'ha_noi',
      district: parsedAddress.district || 'dong_da', 
      ward: parsedAddress.ward || 'unknown',
      administrativeLevel: 0,
      type: mergedDetails.type || 'NORMAL',
      size: mergedDetails.houseArea || 45,
      lotSize: mergedDetails.landArea || 45,
      landArea: mergedDetails.landArea || 45,
      houseArea: mergedDetails.houseArea || 45,
      laneWidth: mergedDetails.laneWidth || 3,
      facadeWidth: mergedDetails.facadeWidth || 3,
      storyNumber: mergedDetails.storyNumber || 3,
      bedrooms: mergedDetails.bedRoom || 2,
      bathrooms: mergedDetails.bathRoom || 2,
      legal: mergedDetails.legal || 'contract',
      amenities: amenities,
      yearBuilt: mergedDetails.yearBuilt || 2015,
      marketData: marketData,
      searchData: 'Không có dữ liệu search từ internet.',
    };

    console.log('📊 Shared AI Input prepared');
    console.log(`⏱️  Step 3 time: ${Date.now() - step3Start}ms`);

    // Step 4: Run BOTH AI functions in PARALLEL
    console.log('\n🚀 STEP 4: Running BOTH AI functions in PARALLEL...');
    const step4Start = Date.now();

    console.log('⚡ Starting propertyValuationRange...');
    console.log('⚡ Starting propertyAnalysis...');
    console.log('⚡ Both functions running concurrently...');

    const [valuationResult, analysisResult] = await Promise.all([
      propertyValuationRange(sharedInput).catch(error => {
        console.error('❌ Valuation error:', error);
        return { error: `Valuation failed: ${error.message}` };
      }),
      propertyAnalysis(sharedInput).catch(error => {
        console.error('❌ Analysis error:', error);
        return { error: `Analysis failed: ${error.message}` };
      })
    ]);

    const step4Time = Date.now() - step4Start;
    console.log(`⚡ BOTH AI functions completed in ${step4Time}ms`);
    console.log('✅ Property Valuation:', 'error' in valuationResult ? 'Failed' : 'Success');
    console.log('✅ Property Analysis:', 'error' in analysisResult ? 'Failed' : 'Success');

    // Final result
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`);
    console.log('🤖🔥 =================');

    return NextResponse.json({
      success: true,
      results: {
        valuation: 'error' in valuationResult ? null : valuationResult,
        analysis: 'error' in analysisResult ? null : analysisResult,
      },
      input_data: {
        coordinates: latitude && longitude ? [latitude, longitude] : null,
        property_details: property_details,
        parsed_address: parsedAddress,
        shared_input: sharedInput,
      },
      performance: {
        total_time: totalTime,
        step_times: {
          location_data: Date.now() - step1Start,
          market_data: Date.now() - step2Start,
          preparation: Date.now() - step3Start,
          parallel_ai_execution: step4Time,
        }
      },
      errors: {
        valuation_error: 'error' in valuationResult ? valuationResult.error : null,
        analysis_error: 'error' in analysisResult ? analysisResult.error : null,
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ AI Combined API Error:', error);
    console.log(`⏱️  Error after: ${totalTime}ms`);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: { total_time: totalTime }
      },
      { status: 500 }
    );
  }
} 