'use server';

import { z } from 'zod';
import { propertyValuationRange } from '@/ai/flows/property-valuation';
import { propertySummary } from '@/ai/flows/property-analysis';
import type { CombinedResult, PropertyInputSchema, ApiValuationResult } from '@/lib/types';
import { config } from '@/lib/config';

const propertyInputSchema = z.object({
  address: z.string().min(5, 'Vui lòng nhập địa chỉ hợp lệ.'),
  type: z.enum(['apartment', 'lane_house', 'town_house', 'villa', 'land', 'shop_house'], {
    required_error: 'Vui lòng chọn loại bất động sản.',
  }),
  houseArea: z.coerce.number().min(10, 'Diện tích sàn phải lớn hơn 10m².'),
  landArea: z.coerce.number().min(10, 'Diện tích đất phải lớn hơn 10m².'),
  facadeWidth: z.coerce.number().min(1, 'Chiều rộng mặt tiền phải lớn hơn 1m.'),
  laneWidth: z.coerce.number().min(1, 'Chiều rộng đường/hẻm phải lớn hơn 1m.'),
  storyNumber: z.coerce.number().min(1, 'Phải có ít nhất 1 tầng.'),
  bedrooms: z.coerce.number().min(1, 'Phải có ít nhất 1 phòng ngủ.'),
  bathrooms: z.coerce.number().min(1, 'Phải có ít nhất 1 phòng tắm.'),
  legal: z.enum(['contract', 'white_book', 'pink_book', 'red_book'], {
    required_error: 'Vui lòng chọn tình trạng pháp lý.',
  }),
});

// Generate mock valuation data when API fails
function generateMockValuation(payload: any) {
  const basePricePerSqm = 65000000; // 65M VND per sqm (base price)
  const locationMultiplier = Math.random() * 0.4 + 0.8; // 0.8 - 1.2
  const housePrice = payload.houseArea * basePricePerSqm * locationMultiplier;
  const landPrice = payload.landArea * basePricePerSqm * 0.7 * locationMultiplier;
  const totalPrice = housePrice + landPrice;

  return {
    evaluation: {
      address: {
        type: 'NORMAL',
        city: payload.address?.city || 'ha_noi',
        district: payload.address?.district || 'dong_da',
        ward: payload.address?.ward || 'lang_thuong',
        administrativeLevel: 0,
      },
      bathRoom: payload.bathRoom || 2,
      bedRoom: payload.bedRoom || 3,
      builtYear: new Date().getFullYear() - 5,
      cityCenterDistance: Math.random() * 20 + 5,
      cityLevel: 1,
      clusterPrices: [[], [], []],
      createdDate: new Date().toISOString(),
      districtCenterDistance: Math.random() * 5 + 0.5,
      districtLevel: 1,
      facadeWidth: payload.facadeWidth || 4,
      geoLocation: payload.geoLocation || [105.8342, 21.0278],
      hasGarden: payload.hasGarden || false,
      homeQualityRemaining: 0,
      houseArea: payload.houseArea || 45,
      housePrice: housePrice,
      landArea: payload.landArea || 60,
      laneWidth: payload.laneWidth || 10,
      legal: payload.legal || "pink_book",
      modifiedDate: new Date().toISOString(),
      ownerId: 44724,
      price: 0,
      radarScore: {
        descriptions: [
          'Bất động sản có vị trí khá thuận lợi với nhiều tiện ích xung quanh, phù hợp cho việc sinh sống và đầu tư.',
          'Pháp lý rõ ràng với sổ đỏ chính chủ, đảm bảo quyền sở hữu cho người mua.',
          'Khu vực có tiềm năng phát triển tốt trong tương lai nhờ các dự án hạ tầng.',
          'Giá bán phù hợp với thị trường hiện tại, cạnh tranh với các bất động sản cùng khu vực.'
        ],
        dividendScore: Math.floor(Math.random() * 3) + 6, // 6-8
        evaluationScore: Math.floor(Math.random() * 2) + 6.5, // 6.5-7.5
        legalityScore: Math.floor(Math.random() * 2) + 8, // 8-9
        liquidityScore: Math.floor(Math.random() * 3) + 5, // 5-7
        locationScore: Math.floor(Math.random() * 3) + 6 // 6-8
      },
      storyNumber: payload.storyNumber || 3,
      totalPrice: totalPrice,
      transId: Date.now(),
      type: payload.type || "town_house",
      year: new Date().getFullYear()
    }
  };
}

// Real API valuation using Resta.vn
export async function getRealApiValuation(
  data: PropertyInputSchema & { latitude?: number; longitude?: number }
): Promise<{ success: true; data: ApiValuationResult } | { success: false; error: string }> {
  const validatedFields = propertyInputSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
    };
  }

  try {
    // Use coordinates if provided, otherwise default to Hanoi center
    const coordinates = {
      latitude: data.latitude || 21.0282993,
      longitude: data.longitude || 105.8539963
    };

    const result: {
      input_coordinates: [number, number];
      location_info: any;
      parsed_address: any;
      valuation_payload: any;
      valuation_result: any;
      success: boolean;
      error: string | null;
    } = {
      input_coordinates: [coordinates.latitude, coordinates.longitude],
      location_info: null,
      parsed_address: null,
      valuation_payload: null,
      valuation_result: null,
      success: false,
      error: null,
    };

    // Step 1: Get location info from coordinates
    const locationUrl = 'https://apis.resta.vn/erest-listing/features/location';
    const locationParams = new URLSearchParams({
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString(),
    });

    const locationHeaders = {
      'accept-encoding': 'gzip',
      'host': 'apis.resta.vn',
      'user-agent': 'Dart/2.19 (dart:io)',
    };

    const locationResponse = await fetch(`${locationUrl}?${locationParams}`, {
      method: 'GET',
      headers: locationHeaders,
    });

    if (!locationResponse.ok) {
      throw new Error('Cannot get location information from coordinates');
    }

    const locationData = await locationResponse.json();
    result.location_info = locationData;

    // Step 2: Parse location information
    const features = locationData?.features || [];
    if (!features.length) {
      throw new Error('Cannot parse location information');
    }

    const mainFeature = features[0];
    const parsedAddress = {
      city: mainFeature?.c || '',
      district: mainFeature?.d || '',
      ward: mainFeature?.w || '',
      coordinates: mainFeature?.g || [],
      formatted_address: mainFeature?.dt || '',
      polygon: mainFeature?.polygon || [],
      bounding_box: mainFeature?.bb || [],
    };

    result.parsed_address = parsedAddress;

    // Step 3: Create valuation payload
    const propertyDetails = {
      type: validatedFields.data.type,
      landArea: validatedFields.data.landArea,
      houseArea: validatedFields.data.houseArea,
      bedRoom: validatedFields.data.bedrooms,
      bathRoom: validatedFields.data.bathrooms,
      storyNumber: validatedFields.data.storyNumber,
      facadeWidth: validatedFields.data.facadeWidth,
      laneWidth: validatedFields.data.laneWidth,
      legal: validatedFields.data.legal,
      hasGarden: false,
      year: new Date().getFullYear()
    };

    const payload = {
      type: propertyDetails.type,
      transId: Date.now(),
      geoLocation: parsedAddress.coordinates,
      address: {
        city: parsedAddress.city,
        district: parsedAddress.district,
        ward: parsedAddress.ward,
        addressCode: null,
        name: parsedAddress.formatted_address,
        detail: parsedAddress.formatted_address,
      },
      landArea: propertyDetails.landArea,
      houseArea: propertyDetails.houseArea,
      laneWidth: propertyDetails.laneWidth,
      'homeQualityRemaining ': 0.0,
      facadeWidth: propertyDetails.facadeWidth,
      storyNumber: propertyDetails.storyNumber,
      bedRoom: propertyDetails.bedRoom,
      bathRoom: propertyDetails.bathRoom,
      legal: propertyDetails.legal,
      utilities: null,
      strengths: null,
      weaknesses: null,
    };

    result.valuation_payload = payload;

    // Step 4: Perform valuation
    const authToken = config.resta.authToken;
    
    try {
      const valuationUrl = 'https://apis.resta.vn/erest-listing/real-estate-evaluations';

      const valuationHeaders = {
        'accept-encoding': 'gzip',
        'authorization': `Bearer ${authToken}`,
        'content-type': 'text/plain; charset=utf-8',
        'user-agent': 'Dart/2.19 (dart:io)',
      };

      const valuationResponse = await fetch(valuationUrl, {
        method: 'POST',
        headers: valuationHeaders,
        body: JSON.stringify(payload),
      });

      if (!valuationResponse.ok) {
        const errorText = await valuationResponse.text();
        console.error('API Error:', errorText);
        
        // If token is invalid, return mock data instead of failing
        if (valuationResponse.status === 401) {
          console.log('🔄 Token expired, generating mock data...');
          const mockValuation = generateMockValuation(payload);
          result.valuation_result = mockValuation;
          result.success = true;
          result.error = 'Using mock data due to API authentication issue';
          return { success: true, data: result };
        }
        
        throw new Error(`Valuation failed with status ${valuationResponse.status}: ${errorText}`);
      }

      const valuationResult = await valuationResponse.json();
      result.valuation_result = valuationResult;
      result.success = true;

      return { success: true, data: result };
      
    } catch (apiError) {
      console.error('Valuation API Error:', apiError);
      
      // Fallback to mock data if API fails
      console.log('🔄 API failed, generating mock data...');
      const mockValuation = generateMockValuation(payload);
      result.valuation_result = mockValuation;
      result.success = true;
      result.error = 'Using mock data due to API issue';
      return { success: true, data: result };
    }
  } catch (error) {
    console.error('Real API Valuation Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn trong quá trình định giá. Vui lòng thử lại sau.',
    };
  }
}

export async function getValuationAndSummary(
  data: PropertyInputSchema
): Promise<{ success: true; data: CombinedResult } | { success: false; error: string }> {
  const validatedFields = propertyInputSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
    };
  }

  try {
    const marketData =
      'Thị trường địa phương đang có nhu cầu cao, các bất động sản đang được bán cao hơn 5-10% so với giá yêu cầu. Các dự án hạ tầng gần đây, bao gồm một trạm tàu điện mới, đã làm tăng giá trị bất động sản trong 6 tháng qua. Đơn giá trung bình mỗi mét vuông là 65 triệu đồng.';

    const valuationPromise = propertyValuationRange({
      address: validatedFields.data.address,
      size: validatedFields.data.houseArea, // Map houseArea to size for AI flow compatibility
      bedrooms: validatedFields.data.bedrooms,
      bathrooms: validatedFields.data.bathrooms,
      lotSize: validatedFields.data.landArea, // Map landArea to lotSize for AI flow compatibility
      marketData,
    });

    const summaryDetails = {
      location: {
        score: 9,
        details:
          'Vị trí đắc địa tại trung tâm, gần khu tài chính và các địa điểm giải trí. Chỉ số đi bộ cao. Có thể có tiếng ồn từ đường phố.',
      },
      utilities: {
        score: 7,
        details:
          'Giao thông công cộng thuận tiện. Có nhiều cửa hàng tạp hóa, nhưng các cửa hàng đặc sản cần di chuyển một quãng ngắn. Một phòng khám mới vừa mở gần đây.',
      },
      planning: {
        score: 8,
        details:
          'Khu vực nằm trong kế hoạch chỉnh trang đô thị, với các công viên và không gian công cộng mới được quy hoạch. Không có công trình xây dựng lớn gây ảnh hưởng trong thời gian tới.',
      },
      legal: {
        score: 10,
        details:
          'Tình trạng pháp lý hoàn hảo với đầy đủ giấy tờ đã được xác minh (sổ đỏ chính chủ). Không có lịch sử tranh chấp hay thế chấp. Sổ sách rõ ràng.',
      },
      quality: {
        score: 7,
        details:
          'Công trình xây dựng hiện đại (xây năm 2018). Nội thất cao cấp. Các tiện ích chung của tòa nhà (phòng gym, hồ bơi) được bảo trì tốt. Có một vài hao mòn nhỏ về thẩm mỹ ở khu vực chung.',
      },
    };

    const summaryPromise = propertySummary({
      locationScore: summaryDetails.location.score,
      locationDetails: summaryDetails.location.details,
      utilitiesScore: summaryDetails.utilities.score,
      utilitiesDetails: summaryDetails.utilities.details,
      planningScore: summaryDetails.planning.score,
      planningDetails: summaryDetails.planning.details,
      legalScore: summaryDetails.legal.score,
      legalDetails: summaryDetails.legal.details,
      qualityScore: summaryDetails.quality.score,
      qualityDetails: summaryDetails.quality.details,
    });

    const [valuation, summary] = await Promise.all([
      valuationPromise,
      summaryPromise,
    ]);

    return { success: true, data: { valuation, summary, summaryDetails } };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn trong quá trình định giá. Vui lòng thử lại sau.',
    };
  }
}
