import { NextRequest, NextResponse } from 'next/server';

// Helper function to fetch data from API
async function fetchTrendData(city: string, district: string, category: string) {
  const apiUrl = `https://apis.resta.vn/erest-listing/v2/market-real-estate-prices/aggregate`;
  const params = new URLSearchParams();
  params.append('address.city', city);
  params.append('address.district', district);
  params.append('category', category);
  params.append('createdDate', 'gte2024-07');
  params.append('createdDate', 'lte2025-06-30');

  const fullUrl = `${apiUrl}?${params}`;
  console.log(`🌐 Trying API: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'EstateValuate/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  return await response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'ha_noi';
    const district = searchParams.get('district') || 'thanh_xuan';
    const category = searchParams.get('category') || 'nha_mat_pho';

    console.log('🔍 Fetching price trend data...');
    console.log(`📍 Location: ${city} - ${district}`);
    console.log(`🏠 Category: ${category}`);

    let result = null;
    let dataSource = 'api';
    let fallbackInfo = '';

    try {
      // First attempt: Try with original category
      console.log(`🎯 Attempt 1: ${category} in ${district}, ${city}`);
      result = await fetchTrendData(city, district, category);
      
      // Check if we got meaningful data
      const processedData = processTrendData(result, category);
      if (processedData.length > 0) {
        console.log('✅ Success with original category');
        return NextResponse.json({
          success: true,
          data: processedData,
          source: dataSource,
          category: category,
          fallback: false
        });
      } else {
        throw new Error('No data in response');
      }

    } catch (error) {
      console.log(`❌ Failed with ${category}: ${error}`);
      
      // Fallback attempt: Try with town_house (nha_mat_pho) if original category wasn't town_house
      if (category !== 'nha_mat_pho') {
        try {
          console.log(`🔄 Attempt 2: Fallback to nha_mat_pho in ${district}, ${city}`);
          result = await fetchTrendData(city, district, 'nha_mat_pho');
          
          const processedData = processTrendData(result, 'nha_mat_pho');
          if (processedData.length > 0) {
            console.log('✅ Success with fallback category');
            fallbackInfo = `Fallback to nha_mat_pho from ${category}`;
            return NextResponse.json({
              success: true,
              data: processedData,
              source: dataSource,
              category: 'nha_mat_pho',
              fallback: true,
              fallbackInfo: fallbackInfo
            });
          }
        } catch (fallbackError) {
          console.log(`❌ Fallback also failed: ${fallbackError}`);
        }
      }
      
      // If all attempts fail, return no data
      console.log('❌ All attempts failed, no data available');
      return NextResponse.json({
        success: false,
        data: [],
        source: 'none',
        category: category,
        fallback: false,
        error: `Không có dữ liệu thị trường cho ${category} tại ${district}, ${city}.`
      });
    }

  } catch (error) {
    console.error('❌ Error in price trend API:', error);
    
    // Return no data on error
    return NextResponse.json({
      success: false,
      data: [],
      source: 'none',
      error: `Lỗi khi lấy dữ liệu thị trường: ${error}`
    });
  }
}

// Process the API response into chart-friendly format
function processTrendData(apiResponse: any, category: string) {
  // Get data array based on category
  const dataArray = apiResponse[category];
  
  if (!dataArray || !Array.isArray(dataArray)) {
    console.log(`⚠️  No data found for category: ${category}`);
    return [];
  }

  console.log(`📊 Processing ${dataArray.length} items for category: ${category}`);
  console.log(`💰 Calculating price per m² trends`);

  const chartData = dataArray
    .filter((item: any) => item.createdDate && item.pricePerUnit)
    .sort((a: any, b: any) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())
    .map((item: any) => {
      const date = new Date(item.createdDate);
      const month = `T${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
      
      // Ensure we're working with price per m² (not total price)
      const pricePerSqm = item.pricePerUnit; // This should already be VND per m²
      const pricePerSqmInMillions = Math.round(pricePerSqm / 1000000); // Convert to millions VND per m²
      
      return {
        month,
        price: pricePerSqmInMillions, // Price per m² in millions VND
        priceRaw: pricePerSqm, // Raw price per m² in VND
        count: item.count,
        minPrice: item.minPrice, // Min price per m² in VND
        maxPrice: item.maxPrice, // Max price per m² in VND
        date: item.createdDate
      };
    });

  console.log(`📈 Processed ${chartData.length} price per m² data points`);
  return chartData;
}

 