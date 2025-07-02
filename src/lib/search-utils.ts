import { getPerplexityApiKey } from './config';

interface PerplexityMessage {
  role: string;
  content: string;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Gọi Perplexity AI API để search thông tin bất động sản
 */
export async function searchRealEstateData(location: string, parsedAddress?: any): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    const searchQuery = `Giá bất động sản tại ${location} và biến động tại năm ${currentYear}`;
    
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${getPerplexityApiKey()}`);
    headers.append("Content-Type", "application/json");

    const requestBody = JSON.stringify({
      "model": "sonar-pro",
      "messages": [
        {
          "role": "system",
          "content": "Bạn là chuyên gia về bất động sản, nhiều năm kinh nghiệm trong thẩm định giá. Luôn chú ý và trả lời trọng tâm, ngắn gọn về các thông tin về giá, xu hướng thị trường và các dự án phát triển."
        },
        {
          "role": "user",
          "content": searchQuery
        }
      ],
      "max_tokens": 500,
      "temperature": 0.2
    });

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: headers,
      body: requestBody,
    });

    if (!response.ok) {
      console.warn(`Perplexity AI search failed: ${response.status}`);
      return '';
    }

    const data: PerplexityResponse = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.warn('Invalid response from Perplexity AI');
      return '';
    }

    // Lấy content từ response và format lại
    const searchContent = data.choices[0].message.content;
    return formatPerplexityResponse(searchContent, location, parsedAddress);

  } catch (error) {
    console.error('Error calling Perplexity AI API:', error);
    return '';
  }
}

/**
 * Format response từ Perplexity AI thành dạng phù hợp cho AI prompt
 */
function formatPerplexityResponse(content: string, location: string, parsedAddress?: any): string {
  // Tạo location context
  const locationContext = parsedAddress 
    ? `${parsedAddress.ward}, ${parsedAddress.district}, ${parsedAddress.city}` 
    : location;

  // Trích xuất thông tin giá từ response
  const priceInfo = extractPriceInfoFromContent(content);
  const trendInfo = extractTrendInfoFromContent(content);

  return `
**Dữ liệu search được từ Perplexity AI về ${locationContext}:**

**Thông tin chính:**
${content}

**Thông tin giá trích xuất:**
${priceInfo}

**Xu hướng thị trường:**
${trendInfo}

**Tóm tắt:** Thông tin về bất động sản tại ${locationContext} được cập nhật từ các nguồn tin tức và dữ liệu thị trường mới nhất năm ${new Date().getFullYear()}.
`.trim();
}

/**
 * Trích xuất thông tin giá từ content
 */
function extractPriceInfoFromContent(content: string): string {
  const pricePattern = /(\d+(?:\.\d+)?)\s*(triệu|tỷ|tr)/gi;
  const prices = [...content.matchAll(pricePattern)];
  
  if (prices.length > 0) {
    const priceList = prices.slice(0, 3).map(match => match[0]).join(', ');
    return `- Giá tham khảo: ${priceList}`;
  }
  
  return '- Chưa tìm thấy thông tin giá cụ thể trong kết quả.';
}

/**
 * Trích xuất thông tin xu hướng từ content
 */
function extractTrendInfoFromContent(content: string): string {
  const trendKeywords = ['tăng', 'giảm', 'ổn định', 'biến động', 'xu hướng'];
  const lines = content.split('\n');
  
  const trendLines = lines.filter(line => 
    trendKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  
  if (trendLines.length > 0) {
    return trendLines.slice(0, 2).map(line => `- ${line.trim()}`).join('\n');
  }
  
  return '- Thông tin xu hướng sẽ được cập nhật dựa trên dữ liệu thị trường.';
}

/**
 * Trích xuất các keywords location từ địa chỉ đầu vào
 */
function extractLocationKeywords(location: string, parsedAddress?: any): string[] {
  const keywords: string[] = [];
  
  // Thêm toàn bộ location
  keywords.push(location);
  
  // Tách các thành phần địa chỉ
  const parts = location.split(',').map(part => part.trim());
  keywords.push(...parts);
  
  // Thêm thông tin từ parsedAddress nếu có
  if (parsedAddress) {
    if (parsedAddress.city) keywords.push(parsedAddress.city);
    if (parsedAddress.district) keywords.push(parsedAddress.district);
    if (parsedAddress.ward) keywords.push(parsedAddress.ward);
  }
  
  // Thêm các từ khóa chung
  keywords.push('bắc ninh', 'từ sơn');
  
  return keywords.filter(k => k.length > 0);
}

/**
 * Lấy keywords cho tỉnh/thành phố từ parsedAddress
 */
function getCityProvinceKeywords(parsedAddress?: any): string[] {
  const keywords: string[] = [];
  
  if (!parsedAddress) return keywords;
  
  // Mapping các city codes thành tên đầy đủ
  const cityMapping: Record<string, string[]> = {
    'ha_noi': ['hà nội', 'hanoi', 'thủ đô'],
    'ho_chi_minh': ['hồ chí minh', 'ho chi minh', 'sài gòn', 'saigon'],
    'bac_ninh': ['bắc ninh', 'bac ninh'],
    'hai_phong': ['hải phòng', 'hai phong'],
    'da_nang': ['đà nẵng', 'da nang'],
    'binh_duong': ['bình dương', 'binh duong'],
    'dong_nai': ['đồng nai', 'dong nai'],
  };
  
  // Thêm từ city code
  if (parsedAddress.city && cityMapping[parsedAddress.city]) {
    keywords.push(...cityMapping[parsedAddress.city]);
  }
  
  // Thêm trực tiếp nếu không có trong mapping
  if (parsedAddress.city) {
    keywords.push(parsedAddress.city.replace(/_/g, ' '));
  }
  
  return keywords;
}

 