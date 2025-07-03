import { NextRequest, NextResponse } from 'next/server';
import { getDistanceAnalysis } from '@/lib/distance-utils';
import { mergeDetailsWithUtilities } from '@/lib/utils';

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
      distance_analysis: any;
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
      distance_analysis: null,
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
      // Task 1: AI Combined API (Valuation + Analysis in PARALLEL)
      (async () => {
        console.log('🤖🔥 [PARALLEL] Starting AI Combined API (Valuation + Analysis)...');
        try {
          const aiCombinedResponse = await fetch(`${request.nextUrl.origin}/api/ai-combined`, {
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

          if (aiCombinedResponse.ok) {
            const aiCombinedData = await aiCombinedResponse.json();
            console.log('✅ [PARALLEL] AI Combined API completed');
            
            // Extract both results from combined response
            return { 
              type: 'ai_combined', 
              data: aiCombinedData, 
              success: true,
              // Extract individual results for backward compatibility
              ai_valuation: aiCombinedData.results?.valuation,
              ai_analysis: aiCombinedData.results?.analysis,
            };
          } else {
            const errorText = await aiCombinedResponse.text();
            console.error('❌ [PARALLEL] AI Combined API failed:', aiCombinedResponse.status, errorText);
            return { 
              type: 'ai_combined', 
              data: null, 
              success: false, 
              error: `AI Combined failed: ${aiCombinedResponse.status} - ${errorText}` 
            };
          }
        } catch (error) {
          console.error('❌ [PARALLEL] AI Combined error:', error);
          return { 
            type: 'ai_combined', 
            data: null, 
            success: false, 
            error: `AI Combined error: ${error instanceof Error ? error.message : 'Unknown error'}` 
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




      // Task 5: Distance Analysis
      (async () => {
        console.log('📏 [PARALLEL] Starting distance analysis...');
        try {
          const distanceAnalysis = await getDistanceAnalysis(
            latitude,
            longitude,
            parsedAddress.formatted_address
          );
          
          console.log('✅ [PARALLEL] Distance analysis completed');
          console.log(`📏 Distance to city center: ${distanceAnalysis.distances.toCityCenter?.distance || 'N/A'} km`);
          console.log(`📏 Distance to district center: ${distanceAnalysis.distances.toDistrictCenter?.distance || 'N/A'} km`);
          console.log(`📏 Accessibility rating: ${distanceAnalysis.analysis.accessibility}`);
          
          return { 
            type: 'distance_analysis', 
            data: distanceAnalysis, 
            success: true 
          };
        } catch (error) {
          console.error('❌ [PARALLEL] Distance analysis error:', error);
          return { 
            type: 'distance_analysis', 
            data: null, 
            success: false, 
            error: `Distance analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
          case 'ai_combined':
            // Handle combined AI result and extract individual parts
            if (success && 'ai_valuation' in taskValue && taskValue.ai_valuation) {
              result.ai_valuation = taskValue.ai_valuation;
              console.log(`✅ AI Valuation (from combined): Success`);
            } else {
              result.ai_valuation = null;
              console.log(`❌ AI Valuation (from combined): Failed`);
            }
            
            if (success && 'ai_analysis' in taskValue && taskValue.ai_analysis) {
              result.ai_analysis = taskValue.ai_analysis;
              console.log(`✅ AI Analysis (from combined): Success`);
            } else {
              result.ai_analysis = null;
              console.log(`❌ AI Analysis (from combined): Failed`);
            }
            
            if (!success && error) {
              result.error = error;
            }
            console.log(`✅ AI Combined: ${success ? 'Success' : 'Failed'}`);
            break;
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
          case 'distance_analysis':
            result.distance_analysis = data;
            console.log(`✅ Distance Analysis: ${success ? 'Success' : 'Failed'}`);
            break;
        }
      } else {
        console.error(`❌ Task ${index} failed:`, taskResult.reason);
      }
    });

    // Step 7: Re-run AI functions with enhanced details (if utilities data is available)
    if (result.utilities && result.utilities.data && result.utilities.data.length > 0) {
      console.log('\n🔄 STEP 7: Re-running AI functions with amenities data...');
      const enhancedStart = Date.now();
      
      // Merge utilities into property details
      const enhancedDetails = mergeDetailsWithUtilities(mergedDetails, result.utilities);
      console.log(`🔄 Enhanced details with ${enhancedDetails.amenities?.length || 0} amenities from utilities:`, enhancedDetails.amenities);
      
      // Re-run AI functions with enhanced details in parallel
      const enhancedTasks = [
        // Enhanced AI Valuation
        (async () => {
          console.log('🤖 [ENHANCED] Re-running AI valuation with amenities...');
          try {
            const aiValuationResponse = await fetch(`${request.nextUrl.origin}/api/property-valuation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                latitude,
                longitude,
                property_details: enhancedDetails, // Using enhanced details with amenities
                auth_token
              }),
            });

            if (aiValuationResponse.ok) {
              const aiValuationData = await aiValuationResponse.json();
              console.log('✅ [ENHANCED] AI Valuation with amenities completed');
              return { type: 'enhanced_ai_valuation', data: aiValuationData, success: true };
            } else {
              console.log('⚠️  [ENHANCED] AI Valuation failed, keeping original result');
              return { type: 'enhanced_ai_valuation', data: null, success: false };
            }
          } catch (error) {
            console.log('⚠️  [ENHANCED] AI Valuation error, keeping original result:', error);
            return { type: 'enhanced_ai_valuation', data: null, success: false };
          }
        })(),

        // Enhanced AI Analysis
        (async () => {
          console.log('🧠 [ENHANCED] Re-running AI analysis with amenities...');
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
                property_details: enhancedDetails, // Using enhanced details with amenities
                auth_token
              }),
            });

            if (aiAnalysisResponse.ok) {
              const aiAnalysisData = await aiAnalysisResponse.json();
              console.log('✅ [ENHANCED] AI Analysis with amenities completed');
              return { type: 'enhanced_ai_analysis', data: aiAnalysisData, success: true };
            } else {
              console.log('⚠️  [ENHANCED] AI Analysis failed, keeping original result');
              return { type: 'enhanced_ai_analysis', data: null, success: false };
            }
          } catch (error) {
            console.log('⚠️  [ENHANCED] AI Analysis error, keeping original result:', error);
            return { type: 'enhanced_ai_analysis', data: null, success: false };
          }
        })(),
      ];

      // Execute enhanced tasks
      const enhancedResults = await Promise.allSettled(enhancedTasks);
      
      // Update results with enhanced data if successful
      enhancedResults.forEach((taskResult) => {
        if (taskResult.status === 'fulfilled') {
          const taskValue = taskResult.value;
          const { type, data, success } = taskValue;
          
          if (success && data) {
            switch (type) {
              case 'enhanced_ai_valuation':
                result.ai_valuation = data;
                console.log('🔄 Updated AI Valuation with amenities data');
                break;
              case 'enhanced_ai_analysis':
                result.ai_analysis = data;
                console.log('🔄 Updated AI Analysis with amenities data');
                break;
            }
          }
        }
      });

      result.performance.step_times.enhanced_execution = Date.now() - enhancedStart;
      console.log(`✅ Enhanced execution completed in ${result.performance.step_times.enhanced_execution}ms`);
    }

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
    console.log(`📏 Distance Analysis: ${result.distance_analysis ? 'Completed' : 'Failed'}`);
    
    // Print distance analysis summary
    if (result.distance_analysis) {
      const distanceData = result.distance_analysis;
      if (distanceData.distances?.toCityCenter) {
        console.log(`   🏛️  To city center (${distanceData.distances.toCityCenter.name}): ${distanceData.distances.toCityCenter.distance} km`);
      }
      if (distanceData.distances?.toDistrictCenter) {
        console.log(`   🏢 To district center (${distanceData.distances.toDistrictCenter.name}): ${distanceData.distances.toDistrictCenter.distance} km`);
      }
      if (distanceData.analysis?.accessibility) {
        console.log(`   🚗 Accessibility: ${distanceData.analysis.accessibility}`);
      }
    }
    
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