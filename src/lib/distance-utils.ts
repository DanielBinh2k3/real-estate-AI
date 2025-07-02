// Utility functions for calculating distances and finding center coordinates

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse Vietnamese address to get city and district names
 * @param formattedAddress Full formatted address string
 * @returns Object with parsed city and district names
 */
export function parseVietnameseAddress(formattedAddress: string): {
  city: string | null;
  district: string | null;
} {
  if (!formattedAddress) {
    return { city: null, district: null };
  }

  // Remove coordinates from address if present
  const addressWithoutCoords = formattedAddress.replace(/^\d+°\d+'[\d.]*"[NS]\s+\d+°\d+'[\d.]*"[EW],?\s*/, '').trim();
  
  // Split by comma and get last parts
  const parts = addressWithoutCoords.split(',').map(part => part.trim());
  
  let city = null;
  let district = null;

  // Extract city (last part, usually province/city name)
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    city = lastPart;
  }

  // Extract district (second to last, or find part with "Quận", "Huyện", "Thị xã", "Thành phố")
  for (let i = parts.length - 2; i >= 0; i--) {
    const part = parts[i];
    if (part.includes('Quận') || part.includes('Huyện') || part.includes('Thị xã') || part.includes('Thành phố')) {
      district = part;
      break;
    }
  }

  return { city, district };
}

/**
 * Find coordinates for Vietnamese administrative centers
 * @param cityName City/Province name
 * @param districtName District name (optional)
 * @returns Coordinates and distance calculations
 */
export async function findAdministrativeCenters(
  propertyLat: number,
  propertyLon: number,
  cityName: string,
  districtName?: string
): Promise<{
  cityCenter: { lat: number; lon: number; distance: number; name: string } | null;
  districtCenter: { lat: number; lon: number; distance: number; name: string } | null;
}> {
  try {
    // Import coordinates data
    const coordinatesData = await import('../../province_district_coordinates.json');
    const data = coordinatesData.default;

    let cityCenter = null;
    let districtCenter = null;

    // Find matching city/province
    for (const [provinceName, provinceData] of Object.entries(data)) {
      const cityNameNormalized = cityName?.toLowerCase().replace(/\s+/g, '');
      const provinceNameNormalized = provinceName.toLowerCase().replace(/\s+/g, '');
      
      if (cityNameNormalized && provinceNameNormalized.includes(cityNameNormalized)) {
        // Found matching city/province
        const cityLat = (provinceData as any).latitude;
        const cityLon = (provinceData as any).longitude;
        
        if (cityLat && cityLon) {
          const cityDistance = calculateDistance(propertyLat, propertyLon, cityLat, cityLon);
          cityCenter = {
            lat: cityLat,
            lon: cityLon,
            distance: cityDistance,
            name: provinceName
          };
        }

        // Find matching district if provided
        if (districtName && (provinceData as any).districts) {
          const districtNameNormalized = districtName.toLowerCase().replace(/\s+/g, '');
          
          for (const district of (provinceData as any).districts) {
            const districtFullNormalized = district.name.toLowerCase().replace(/\s+/g, '');
            
            if (districtFullNormalized.includes(districtNameNormalized)) {
              const districtLat = district.coordinates.latitude;
              const districtLon = district.coordinates.longitude;
              
              if (districtLat && districtLon) {
                const districtDistance = calculateDistance(propertyLat, propertyLon, districtLat, districtLon);
                districtCenter = {
                  lat: districtLat,
                  lon: districtLon,
                  distance: districtDistance,
                  name: district.name
                };
              }
              break;
            }
          }
        }
        break;
      }
    }

    return { cityCenter, districtCenter };
  } catch (error) {
    console.error('Error finding administrative centers:', error);
    return { cityCenter: null, districtCenter: null };
  }
}

/**
 * Convert coordinates string to decimal degrees
 * @param coordString Coordinate string like "21°01'41.9\"N" or "105°51'14.4\"E"
 * @returns Decimal degrees
 */
export function parseCoordinateString(coordString: string): number | null {
  try {
    // Remove whitespace
    const clean = coordString.trim();
    
    // Parse format like "21°01'41.9\"N" or "105°51'14.4\"E"
    const match = clean.match(/^(\d+)°(\d+)'([\d.]+)"([NSEW])$/);
    
    if (!match) return null;
    
    const degrees = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4];
    
    let decimal = degrees + minutes / 60 + seconds / 3600;
    
    // Apply direction (negative for South and West)
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  } catch (error) {
    console.error('Error parsing coordinate string:', error);
    return null;
  }
}

/**
 * Get distance summary for a property location
 * @param latitude Property latitude
 * @param longitude Property longitude
 * @param formattedAddress Full formatted address
 * @returns Distance analysis object
 */
export async function getDistanceAnalysis(
  latitude: number,
  longitude: number,
  formattedAddress: string
): Promise<{
  distances: {
    toCityCenter: { distance: number; name: string } | null;
    toDistrictCenter: { distance: number; name: string } | null;
  };
  analysis: {
    accessibility: 'excellent' | 'good' | 'fair' | 'poor';
    locationAdvantage: string;
    marketImpact: string;
  };
}> {
  // Parse address to extract city and district
  const { city, district } = parseVietnameseAddress(formattedAddress);
  
  // Find administrative centers
  const { cityCenter, districtCenter } = await findAdministrativeCenters(
    latitude, 
    longitude, 
    city || '', 
    district || ''
  );

  // Prepare distance results
  const distances = {
    toCityCenter: cityCenter ? { distance: cityCenter.distance, name: cityCenter.name } : null,
    toDistrictCenter: districtCenter ? { distance: districtCenter.distance, name: districtCenter.name } : null
  };

  // Analyze accessibility based on distances
  let accessibility: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let locationAdvantage = '';
  let marketImpact = '';

  const districtDistance = districtCenter?.distance || 999;
  const cityDistance = cityCenter?.distance || 999;

  if (districtDistance <= 2) {
    accessibility = 'excellent';
    locationAdvantage = 'Vị trí trung tâm quận, thuận tiện di chuyển và sinh hoạt';
    marketImpact = 'Giá trị bất động sản cao, thanh khoản tốt';
  } else if (districtDistance <= 5) {
    accessibility = 'good';
    locationAdvantage = 'Gần trung tâm quận, dễ dàng tiếp cận các tiện ích';
    marketImpact = 'Giá trị bất động sản ổn định, có tiềm năng tăng trưởng';
  } else if (districtDistance <= 10) {
    accessibility = 'fair';
    locationAdvantage = 'Cách trung tâm quận vừa phải, cần phương tiện di chuyển';
    marketImpact = 'Giá trị bất động sản trung bình, phù hợp đầu tư dài hạn';
  } else {
    accessibility = 'poor';
    locationAdvantage = 'Xa trung tâm quận, ít tiện ích xung quanh';
    marketImpact = 'Giá trị bất động sản thấp, thanh khoản hạn chế';
  }

  return {
    distances,
    analysis: {
      accessibility,
      locationAdvantage,
      marketImpact
    }
  };
} 