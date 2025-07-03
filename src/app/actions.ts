'use server';

import { z } from 'zod';
import { propertyValuationRange } from '@/ai/flows/property-valuation';
import { propertyAnalysis } from '@/ai/flows/property-analysis';
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
        
        // If token is invalid, return error
        if (valuationResponse.status === 401) {
          console.log('❌ Token expired, authentication failed');
          result.success = false;
          result.error = 'Lỗi xác thực: Phiên đăng nhập đã hết hạn. Vui lòng liên hệ quản trị viên.';
          return { success: false, error: result.error };
        }
        
        throw new Error(`Valuation failed with status ${valuationResponse.status}: ${errorText}`);
      }

      const valuationResult = await valuationResponse.json();
      result.valuation_result = valuationResult;
      result.success = true;

      return { success: true, data: result };
      
    } catch (apiError) {
      console.error('Valuation API Error:', apiError);
      
      // Return error if API fails
      console.log('❌ API failed, no valuation data available');
      result.success = false;
      result.error = 'Không thể kết nối đến dịch vụ định giá. Vui lòng thử lại sau.';
      return { success: false, error: result.error };
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
      city: 'ha_noi', // Default city
      district: 'dong_da', // Default district  
      ward: 'unknown', // Default ward
      administrativeLevel: 0, // Default administrative level
      type: validatedFields.data.type,
      size: validatedFields.data.houseArea,
      lotSize: validatedFields.data.landArea,
      landArea: validatedFields.data.landArea,
      houseArea: validatedFields.data.houseArea,
      laneWidth: validatedFields.data.laneWidth,
      facadeWidth: validatedFields.data.facadeWidth,
      storyNumber: validatedFields.data.storyNumber,
      bedrooms: validatedFields.data.bedrooms,
      bathrooms: validatedFields.data.bathrooms,
      amenities: [], // Empty amenities array
      yearBuilt: new Date().getFullYear() - 5, // Default to 5 years old
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

    const summaryPromise = propertyAnalysis({
      address: validatedFields.data.address,
      city: 'ha_noi', // Default city
      district: 'dong_da', // Default district
      ward: 'unknown', // Default ward
      administrativeLevel: 0, // Default administrative level
      type: validatedFields.data.type,
      size: validatedFields.data.houseArea,
      lotSize: validatedFields.data.landArea,
      landArea: validatedFields.data.landArea,
      houseArea: validatedFields.data.houseArea,
      laneWidth: validatedFields.data.laneWidth,
      facadeWidth: validatedFields.data.facadeWidth,
      bedrooms: validatedFields.data.bedrooms,
      bathrooms: validatedFields.data.bathrooms,
      amenities: [], // Empty amenities array
      storyNumber: validatedFields.data.storyNumber,
      legal: validatedFields.data.legal,
      yearBuilt: new Date().getFullYear() - 5, // Default to 5 years old
      marketData,
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
