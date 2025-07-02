import { searchRealEstateData } from './search-utils';

/**
 * Test function để kiểm tra search functionality
 */
export async function testSearchFunction() {
  console.log('🔍 Testing search functionality...');
  
  const testCases = [
    {
      location: 'Từ Sơn, Bắc Ninh',
      parsedAddress: {
        city: 'bac_ninh',
        district: 'tu_son',
        ward: 'huong_mac'
      }
    },
    {
      location: 'Hương Mạc, Từ Sơn, Bắc Ninh',
      parsedAddress: {
        city: 'bac_ninh',
        district: 'tu_son',
        ward: 'huong_mac'
      }
    },
    {
      location: 'Thành phố Từ Sơn, Bắc Ninh',
      parsedAddress: {
        city: 'bac_ninh',
        district: 'tu_son',
        ward: 'huong_mac'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📍 Testing location: ${testCase.location}`);
    console.log(`📋 Parsed address: ${JSON.stringify(testCase.parsedAddress)}`);
    try {
      const result = await searchRealEstateData(testCase.location, testCase.parsedAddress);
      console.log('✅ Perplexity AI search result:');
      console.log(result);
      console.log('---');
    } catch (error) {
      console.error('❌ Perplexity AI search failed:', error);
    }
  }
}

// Uncomment để chạy test
// testSearchFunction(); 