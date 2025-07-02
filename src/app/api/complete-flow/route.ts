import { NextRequest, NextResponse } from 'next/server';

// Helper function to format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}



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
  strengths?: any;
  weaknesses?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, property_details, auth_token } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!auth_token) {
      return NextResponse.json(
        { error: 'Auth token is required' },
        { status: 400 }
      );
    }

    console.log('🚀 STARTING OPTIMIZED REAL ESTATE VALUATION FLOW');
    console.log('='.repeat(50));

    const result: {
      input_coordinates: [number, number];
      location_info: any;
      parsed_address: any;
      valuation_payload: any;
      valuation_result: any;
      utilities: any;
      price_trend: any;
      ai_valuation: any;
      ai_analysis: any;
      success: boolean;
      error: string | null;
      performance: {
        total_time: number;
        step_times: Record<string, number>;
      };
    } = {
      input_coordinates: [latitude, longitude],
      location_info: null,
      parsed_address: null,
      valuation_payload: null,
      valuation_result: null,
      utilities: null,
      price_trend: null,
      ai_valuation: null,
      ai_analysis: null,
      success: false,
      error: null,
      performance: {
        total_time: 0,
        step_times: {}
      }
    };

    const startTime = Date.now();

    // Step 1: Get location info from coordinates (Required first)
    console.log('\n📍 STEP 1: Getting location information');
    const step1Start = Date.now();
    
    const locationUrl = 'https://apis.resta.vn/erest-listing/features/location';
    const locationParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });

    const locationHeaders = {
      'accept-encoding': 'gzip',
      'host': 'apis.resta.vn',
      'user-agent': 'Dart/2.19 (dart:io)',
    };

    let locationData;
    try {
      const locationResponse = await fetch(`${locationUrl}?${locationParams}`, {
        method: 'GET',
        headers: locationHeaders,
      });

      if (locationResponse.ok) {
        locationData = await locationResponse.json();
        result.location_info = locationData;
        console.log('✅ Location API successful');
      } else {
        console.log('⚠️  Location API failed, using fallback');
        locationData = { features: [] }; // Empty features to trigger fallback
        result.location_info = { error: `Location API failed with status ${locationResponse.status}` };
      }
    } catch (error) {
      console.log('⚠️  Location API exception, using fallback:', error);
      locationData = { features: [] }; // Empty features to trigger fallback
      result.location_info = { error: `Location API exception: ${error}` };
    }

    // Step 2: Parse location information (Required for next steps)
    console.log('\n🔄 STEP 2: Parsing location information');
    const features = locationData?.features || [];
    
    let parsedAddress;
    if (!features.length) {
      console.log('⚠️  No features found, using fallback location data');
      // Fallback với tọa độ Hà Nội
      parsedAddress = {
        city: 'ha_noi',
        district: 'dong_da',
        ward: 'phuong_trung_liet',
        coordinates: [longitude, latitude],
        formatted_address: `${latitude}, ${longitude}`,
        polygon: [],
        bounding_box: [],
      };
    } else {
      const mainFeature = features[0];
      parsedAddress = {
        city: mainFeature?.c || 'ha_noi',
        district: mainFeature?.d || 'dong_da',
        ward: mainFeature?.w || 'phuong_trung_liet',
        coordinates: mainFeature?.g || [longitude, latitude],
        formatted_address: mainFeature?.dt || `${latitude}, ${longitude}`,
        polygon: mainFeature?.polygon || [],
        bounding_box: mainFeature?.bb || [],
      };
    }

    result.parsed_address = parsedAddress;
    result.performance.step_times.location_and_parsing = Date.now() - step1Start;

    console.log(`📍 Parsed address: ${parsedAddress.formatted_address}`);
    console.log(`🏘️  City: ${parsedAddress.city}`);
    console.log(`🏙️  District: ${parsedAddress.district}`);
    console.log(`🏡 Ward: ${parsedAddress.ward}`);

    // Step 3: Create valuation payload
    console.log('\n📋 STEP 3: Creating valuation payload');
    const defaultDetails: PropertyDetails = {
      type: 'town_house',
      landArea: 45.0,
      houseArea: 45.0,
      laneWidth: 10.0,
      facadeWidth: 4.0,
      storyNumber: 3.0,
      bedRoom: 2,
      bathRoom: 2,
      legal: 'pink_book',
      yearBuilt: 2015,
    };

    const mergedDetails = { ...defaultDetails, ...property_details };

    const valuationPayload = {
      address: {
        type: 'NORMAL',
        city: parsedAddress.city,
        district: parsedAddress.district,
        ward: parsedAddress.ward,
        administrativeLevel: 0,
      },
      bathRoom: mergedDetails.bathRoom,
      bedRoom: mergedDetails.bedRoom,
      geoLocation: [longitude, latitude],
      facadeWidth: mergedDetails.facadeWidth,
      hasGarden: mergedDetails.utilities?.hasGarden || false,
      houseArea: mergedDetails.houseArea,
      landArea: mergedDetails.landArea,
      laneWidth: mergedDetails.laneWidth,
      legal: mergedDetails.legal,
      storyNumber: mergedDetails.storyNumber,
      type: mergedDetails.type,
      yearBuilt: mergedDetails.yearBuilt,
    };

    result.valuation_payload = valuationPayload;

    // Map property type to API category
    const mapPropertyTypeToCategory = (type: string): string => {
      const categoryMap: Record<string, string> = {
        'apartment': 'chung_cu',
        'lane_house': 'nha_hem_ngo', 
        'town_house': 'nha_mat_pho',
        'land': 'ban_dat',
        'villa': 'biet_thu_lien_ke'
      };
      return categoryMap[type] || 'nha_mat_pho';
    };

    // PARALLEL EXECUTION: Steps 4, 5, 6 run concurrently (removed AI calls to prevent circular dependency)
    console.log('\n🚀 EXECUTING PARALLEL API CALLS (Steps 4-6)');
    const parallelStart = Date.now();

    // Define all parallel tasks
    const parallelTasks = [
      // Task 1: AI Valuation API (Internal)
      (async () => {
        console.log('🤖 [PARALLEL] Starting AI valuation API...');
        try {
          // First get price trend data for market data
          const trendParams = new URLSearchParams({
            city: parsedAddress.city,
            district: parsedAddress.district,
            category: mapPropertyTypeToCategory(mergedDetails.type || 'town_house')
          });
          
          const trendResponse = await fetch(`${request.nextUrl.origin}/api/price-trend?${trendParams}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });

          let marketData = "Dữ liệu thị trường không khả dụng. Sử dụng ước tính trung bình 280-320 triệu VND/m².";
          
          if (trendResponse.ok) {
            const trendResult = await trendResponse.json();
            if (trendResult.success && trendResult.data && Array.isArray(trendResult.data)) {
              const data = trendResult.data;
              const latest = data[data.length - 1];
              const earliest = data[0];
              
              const avgPrice = data.reduce((sum: number, item: any) => sum + item.price, 0) / data.length;
              const minPrice = Math.min(...data.map((item: any) => item.minPrice || item.price * 0.7));
              const maxPrice = Math.max(...data.map((item: any) => item.maxPrice || item.price * 1.3));
              
              const trend = latest.price > earliest.price ? "tăng" : "giảm";
              const trendPercent = Math.abs(((latest.price - earliest.price) / earliest.price) * 100).toFixed(1);

              marketData = `
Dữ liệu thị trường bất động sản (${data.length} tháng gần nhất):
- Giá trung bình: ${avgPrice.toFixed(0)} triệu VND/m²
- Khoảng giá: ${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)} triệu VND/m²
- Xu hướng: ${trend} ${trendPercent}% so với ${data.length} tháng trước
- Giá mới nhất (${latest.month}): ${latest.price} triệu VND/m²
- Số lượng giao dịch trung bình: ${(data.reduce((sum: number, item: any) => sum + item.count, 0) / data.length).toFixed(0)} giao dịch/tháng
- Nguồn dữ liệu: API
- Chi tiết từng tháng: ${data.map((item: any) => `${item.month}: ${item.price}M VND/m²`).join(', ')}
              `.trim();
            }
          }

          // Now call AI valuation API
          const aiValuationResponse = await fetch(`${request.nextUrl.origin}/api/property-valuation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              latitude,
              longitude,
              property_details: mergedDetails,
              auth_token
            }),
          });

          if (aiValuationResponse.ok) {
            const aiValuationData = await aiValuationResponse.json();
            console.log('✅ [PARALLEL] AI Valuation API completed');
            return { type: 'ai_valuation', data: aiValuationData, success: true };
          } else {
            const errorText = await aiValuationResponse.text();
            console.error('❌ [PARALLEL] AI Valuation API failed:', aiValuationResponse.status, errorText);
            return { 
              type: 'ai_valuation', 
              data: null, 
              success: false, 
              error: `AI Valuation failed: ${aiValuationResponse.status} - ${errorText}` 
            };
          }
        } catch (error) {
          console.error('❌ [PARALLEL] AI Valuation error:', error);
          return { 
            type: 'ai_valuation', 
            data: null, 
            success: false, 
            error: `AI Valuation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      })(),

      // Task 2: Utilities API
      (async () => {
        console.log('🏪 [PARALLEL] Starting utilities API...');
        try {
          const utilityTypes = ['hospital', 'market', 'restaurant', 'cafe', 'supermarket', 'commercial_center'];
          const utilitiesUrl = `${request.nextUrl.origin}/api/utilities`;
          const utilitiesParams = new URLSearchParams({
            lat: latitude.toString(),
            lng: longitude.toString(),
            distance: '5',
            size: '10',
          });

          console.log(`🏪 Calling utilities API: ${utilitiesUrl}?${utilitiesParams}`);

          const utilitiesResponse = await fetch(`${utilitiesUrl}?${utilitiesParams}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'EstateValuate/1.0',
            },
          });

          if (utilitiesResponse.ok) {
            const utilitiesResult = await utilitiesResponse.json();
            console.log('🏪 Utilities raw response:', JSON.stringify(utilitiesResult, null, 2));
            
            const groupedUtilities = utilityTypes.reduce((acc, type) => {
              acc[type] = utilitiesResult.data?.filter((utility: any) => utility.type === type) || [];
              return acc;
            }, {} as Record<string, any[]>);

            console.log('✅ [PARALLEL] Utilities API completed with', utilitiesResult.data?.length || 0, 'items');
            return {
              type: 'utilities',
              data: {
                total: utilitiesResult.total || 0,
                data: utilitiesResult.data || [],
                groupedData: groupedUtilities,
              },
              success: true
            };
          } else {
            const errorText = await utilitiesResponse.text();
            console.log('⚠️  [PARALLEL] Utilities API failed:', utilitiesResponse.status, errorText);
            return { type: 'utilities', data: null, success: false, error: `Status ${utilitiesResponse.status}: ${errorText}` };
          }
        } catch (error) {
          console.error('❌ [PARALLEL] Utilities error:', error);
          return { type: 'utilities', data: null, success: false, error: `Exception: ${error}` };
        }
      })(),

      // Task 3: Price Trend API
      (async () => {
        console.log('📈 [PARALLEL] Starting price trend API...');
        try {
          const trendParams = new URLSearchParams({
            city: parsedAddress.city,
            district: parsedAddress.district,
            category: mapPropertyTypeToCategory(mergedDetails.type || 'town_house')
          });
          
          const trendUrl = `${request.nextUrl.origin}/api/price-trend?${trendParams}`;
          const trendResponse = await fetch(trendUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });

          if (trendResponse.ok) {
            const trendResult = await trendResponse.json();
            console.log('✅ [PARALLEL] Price trend API completed');
            return {
              type: 'price_trend',
              data: {
                success: trendResult.success,
                data: trendResult.data,
                source: trendResult.source,
                error: trendResult.error || null
              },
              success: true
            };
          } else {
            console.log('⚠️  [PARALLEL] Price trend API failed');
            return {
              type: 'price_trend',
              data: { success: false, error: `API returned status ${trendResponse.status}` },
              success: false
            };
          }
        } catch (error) {
          console.error('❌ [PARALLEL] Price trend error:', error);
          return {
            type: 'price_trend',
            data: { success: false, error: `Error occurred: ${error}` },
            success: false
          };
        }
      })(),


      // Task 4: AI Analysis API
      (async () => {
        console.log('🧠 [PARALLEL] Starting AI analysis API...');
        try {
          const aiAnalysisResponse = await fetch(`${request.nextUrl.origin}/api/property-analysis`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              latitude,
              longitude,
              property_details: mergedDetails,
              auth_token
            }),
          });

          if (aiAnalysisResponse.ok) {
            const aiAnalysisData = await aiAnalysisResponse.json();
            console.log('✅ [PARALLEL] AI Analysis API completed');
            return { type: 'ai_analysis', data: aiAnalysisData, success: true };
          } else {
            const errorText = await aiAnalysisResponse.text();
            console.error('❌ [PARALLEL] AI Analysis API failed:', aiAnalysisResponse.status, errorText);
            return { 
              type: 'ai_analysis', 
              data: null, 
              success: false, 
              error: `AI Analysis failed: ${aiAnalysisResponse.status} - ${errorText}` 
            };
          }
        } catch (error) {
          console.error('❌ [PARALLEL] AI Analysis error:', error);
          return { 
            type: 'ai_analysis', 
            data: null, 
            success: false, 
            error: `AI Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      })(),

    ];

    // Execute all tasks in parallel with timeout
    console.log('⏱️  Executing all tasks in parallel...');
    const parallelResults = await Promise.allSettled(parallelTasks);
    
    result.performance.step_times.parallel_execution = Date.now() - parallelStart;

    // Process parallel results
    parallelResults.forEach((taskResult, index) => {
      if (taskResult.status === 'fulfilled') {
        const taskValue = taskResult.value;
        const { type, data, success } = taskValue;
        const error = 'error' in taskValue ? taskValue.error : undefined;
        
        switch (type) {
          case 'ai_valuation':
            result.ai_valuation = data;
            if (!success && error) {
              result.error = error;
            }
            console.log(`✅ AI Valuation: ${success ? 'Success' : 'Failed'}`);
            break;
          case 'ai_analysis':
            result.ai_analysis = data;
            console.log(`✅ AI Analysis: ${success ? 'Success' : 'Failed'}`);
            break;
          case 'utilities':
            result.utilities = data;
            console.log(`✅ Utilities: ${success ? 'Success' : 'Failed'}`);
            break;
          case 'price_trend':
            result.price_trend = data;
            console.log(`✅ Price Trend: ${success ? 'Success' : 'Failed'}`);
            break;
        }
      } else {
        console.error(`❌ Task ${index} failed:`, taskResult.reason);
      }
    });

    // Note: AI valuation and analysis are now handled by separate endpoints
    // This endpoint provides core property data for other services

    // Calculate performance metrics
    const totalTime = Date.now() - startTime;
    result.performance.total_time = totalTime;
    result.success = true;

    console.log('\n🎉 OPTIMIZED VALUATION FLOW COMPLETED!');
    console.log('='.repeat(50));
    console.log(`⚡ Performance Improvement:`);
    console.log(`   - Total time: ${totalTime}ms`);
    console.log(`   - Location + Parsing: ${result.performance.step_times.location_and_parsing}ms`);
    console.log(`   - Parallel execution: ${result.performance.step_times.parallel_execution}ms`);
    console.log(`   - Estimated sequential time: ${result.performance.step_times.parallel_execution * 5}ms`);
    console.log(`   - Time saved: ~${(result.performance.step_times.parallel_execution * 4)}ms`);

    // Print summary
    console.log(`📍 Address: ${parsedAddress.formatted_address}`);
    console.log(`🏪 Utilities found: ${result.utilities?.total || 0}`);
    console.log(`📈 Price trend data points: ${result.price_trend?.data?.length || 0}`);
    console.log(`🤖 AI Valuation: ${result.ai_valuation ? 'Completed' : 'Failed'}`);
    console.log(`🧠 AI Analysis: ${result.ai_analysis ? 'Completed' : 'Failed'}`);
    
    // Check if critical AI operations failed
    if (!result.ai_valuation && !result.error) {
      result.error = 'AI Valuation failed - this is required for the system to work properly';
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in optimized complete flow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Error during flow execution: ${error}` 
      },
      { status: 500 }
    );
  }
} 