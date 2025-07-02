// Test file for distance utils - Development only
import { 
  calculateDistance, 
  parseVietnameseAddress, 
  findAdministrativeCenters, 
  parseCoordinateString,
  getDistanceAnalysis 
} from './distance-utils';

export async function testDistanceUtils() {
  console.log('🧪 Testing Distance Utils Functions');
  console.log('='.repeat(50));

  // Test 1: Calculate distance between Hoan Kiem and Dong Da
  console.log('\n📏 Test 1: Distance calculation');
  const hoanKiemLat = 21.027365;
  const hoanKiemLon = 105.849486;
  const dongDaLat = 21.0136436;
  const dongDaLon = 105.8225234;
  
  const distance = calculateDistance(hoanKiemLat, hoanKiemLon, dongDaLat, dongDaLon);
  console.log(`Distance between Hoan Kiem and Dong Da: ${distance} km`);

  // Test 2: Parse coordinate string
  console.log('\n🧭 Test 2: Parse coordinate string');
  const latString = "21°01'41.9\"N";
  const lonString = "105°51'14.4\"E";
  
  const parsedLat = parseCoordinateString(latString);
  const parsedLon = parseCoordinateString(lonString);
  console.log(`Parsed coordinates: ${parsedLat}, ${parsedLon}`);

  // Test 3: Parse Vietnamese address
  console.log('\n🏠 Test 3: Parse Vietnamese address');
  const testAddress = "21°01'41.9\"N 105°51'14.4\"E, Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội";
  const parsed = parseVietnameseAddress(testAddress);
  console.log(`Parsed address:`, parsed);

  // Test 4: Find administrative centers
  console.log('\n🏛️  Test 4: Find administrative centers');
  try {
    const centers = await findAdministrativeCenters(
      21.027365, 
      105.849486, 
      'Hà Nội', 
      'Quận Hoàn Kiếm'
    );
    console.log('Administrative centers:', centers);
  } catch (error) {
    console.error('Error finding centers:', error);
  }

  // Test 5: Full distance analysis
  console.log('\n🔍 Test 5: Full distance analysis');
  try {
    const analysis = await getDistanceAnalysis(
      21.027365,
      105.849486,
      "Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội"
    );
    console.log('Distance analysis:', JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Error in distance analysis:', error);
  }

  console.log('\n✅ Distance utils testing completed!');
} 