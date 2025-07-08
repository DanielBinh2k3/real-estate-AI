'use server';

/**
 * @fileOverview Estimates a property's value range (low, reasonable, high) based on its details and market data.
 *
 * - propertyValuationRange - A function that handles the property valuation process.
 * - PropertyValuationRangeInput - The input type for the propertyValuationRange function.
 * - PropertyValuationRangeOutput - The return type for the propertyValuationRange function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyValuationRangeInputSchema = z.object({
  address: z.string().describe('Địa chỉ chi tiết của bất động sản (có thể để trống nếu đã cung cấp city/district/ward).').optional(),
  city: z.string().describe('Thành phố/Tỉnh.'),
  district: z.string().describe('Quận/Huyện.'),
  ward: z.string().describe('Phường/Xã.'),
  administrativeLevel: z.number().describe('Cấp hành chính.'),
  type: z.string().describe('Loại bất động sản (ví dụ: lane_house, NORMAL, v.v.).'),
  size: z.number().describe('Diện tích sàn (m²).'),
  lotSize: z.number().describe('Diện tích lô đất (m²).'),


  
  landArea: z.number().describe('Diện tích đất (m²).'),
  houseArea: z.number().describe('Diện tích sàn xây dựng (m²).'),
  laneWidth: z.number().describe('Chiều rộng hẻm/đường vào (m).'),
  facadeWidth: z.number().describe('Chiều rộng mặt tiền (m).'),
  storyNumber: z.number().describe('Số tầng.').optional(),
  bedrooms: z.number().describe('Số phòng ngủ.').optional(),
  bathrooms: z.number().describe('Số phòng tắm.').optional(),
  amenities: z.array(z.string()).describe('Danh sách tiện ích xung quanh (trường học, bệnh viện, trung tâm thương mại, công viên, giao thông công cộng, v.v.).'),
  yearBuilt: z.number().describe('Năm xây dựng bất động sản.'),
  marketData: z.string().describe('Dữ liệu thị trường hiện tại cho các bất động sản tương đương trong khu vực.'),
  searchData: z.string().describe('Dữ liệu search được từ internet về bất động sản trong khu vực.').optional(),
});
export type PropertyValuationRangeInput = z.infer<typeof PropertyValuationRangeInputSchema>;

const PropertyValuationRangeOutputSchema = z.object({
  lowValue: z.number().describe('Giá thấp nhất có thể cho bất động sản.'),
  reasonableValue: z.number().describe('Giá hợp lý nhất cho bất động sản.'),
  highValue: z.number().describe('Giá cao nhất có thể đạt được cho bất động sản.'),
  price_house: z.number().describe('Giá nhà tham khảo.'),
});
export type PropertyValuationRangeOutput = z.infer<typeof PropertyValuationRangeOutputSchema>;

export async function propertyValuationRange(input: PropertyValuationRangeInput): Promise<PropertyValuationRangeOutput> {
  return propertyValuationRangeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyValuationRangePrompt',
  input: {schema: PropertyValuationRangeInputSchema},
  output: {schema: PropertyValuationRangeOutputSchema},
  prompt: `NHIỆM VỤ: TÍNH TOÁN KHOẢNG GIÁ BẤT ĐỘNG SẢN, kết quả trả ra ngắn gọn không dài dòng, chỉ thực hiện các phép toán
— **THÔNG TIN BẤT ĐỘNG SẢN**  
**Thông tin bất động sản:**
- Địa chỉ: {{{address}}}  
- Khu vực: {{{ward}}}, {{{district}}}, {{{city}}} (Cấp {{{administrativeLevel}}})  
- Loại: {{{type}}}  
- Diện tích: Đất {{{landArea}}}m² / Lô {{{lotSize}}}m² / Sàn XD {{{houseArea}}}m² / Sử dụng {{{size}}}m²
- Kích thước: Lộ giới {{{laneWidth}}}m / Mặt tiền {{{facadeWidth}}}m
- Thiết kế: {{{storyNumber}}} tầng | {{{bedrooms}}} phòng ngủ | {{{bathrooms}}} phòng tắm
- Năm xây dựng: {{{yearBuilt}}}
- Tiện ích xung quanh: {{{amenities}}}  

— **DỮ LIỆU THỊ TRƯỜNG HIỆN TẠI** (bắt buộc tham khảo):  
{{{marketData}}}

— **DỮ LIỆU SEARCH THÔNG TIN BẤT ĐỘNG SẢN** (nếu có):  
{{{searchData}}}

— **QUY TRÌNH ĐỊNH GIÁ**  
1. **Phân tích giá thị trường làm baseline**  
   - Lấy giá mới nhất từ {{{marketData}}} làm cơ sở.  
   - Giá bất động sản phải nằm trong khoảng ±20% giá thị trường.
2. **Tính giá trị reasonableValue** 
   - Công thức:  
     GIÁ_CƠ_BẢN = GIÁ_TRUNG_BÌNH_THỊ_TRƯỜNG × Diện tích đất ({{{lotSize}}} m²)
   - Giá trị = Diện tích × Giá thị trường × Hệ số vị trí 1 x Hệ số vị trí 2 × Hệ số pháp lý x hệ số tiện ích
     - Hệ số vị trí 1:   
       - Cách trung tâm thành phố lớn khoảng 4km: 1,1
       - Cách trung tâm thành phố lớn khoảng 4-15 km: 1,08
       - Cách trung tâm thành phố lớn khoảng  hơn 15: 1,04
       - Đất ở nông thôn, tỉnh lẻ, không ở thành phố: 1
     - Hệ số vị trí 2, dựa trên {{{laneWidth}}}m (lộ giới) và {{{facadeWidth}}}m (mặt tiền):
       - Mặt phố lớn (laneWidth ≥ 15m): 1.2
       - Mặt ngõ ô tô tránh (laneWidth 8-15m): 1.1
       - Ngõ ô tô một chiều (laneWidth 4-8m): 1.05 
       - Ngõ nhỏ xe máy (laneWidth < 4m): 0.97
       - Bonus mặt tiền rộng: +0.02 cho mỗi m nếu facadeWidth ≥ 5m
     - Hệ số pháp lý:
      - Sổ đỏ/ sổ hồng chính chủ: 1.0
      - Đồng sở hữu: 0.8
      - Giấy viết tay: 0.55
      - Tranh chấp hoặc quy hoạch: 0.45
     - Hệ số tiện ích:
      - Có nhiều hơn 3 tiện ích xung quanh: 1.05
      - Có khoảng 1-2 tiện ích xung quanh: 1.02
3. **Tính giá trị xây dựng**  
   - Tổng diện tích sàn = Diện tích đất ({{{size}}} m²) × Số tầng ({{{storyNumber}}})  
   - Giá trị xây dựng = Tổng diện tích sàn × Đơn giá xây × Hệ số hao mòn  
     - Đơn giá xây dựng (thành phố lớn):  
       - Nhà 4–5 tầng BTCT: 7 triệu/m²  
       - Nhà 2–3 tầng: 6.5 triệu/m²  
       - Nhà cấp 4 hoặc nhà cũ: 4.5 triệu/m²  
     - **Hệ số hao mòn theo tuổi nhà**  
       1. Tính tuổi nhà = Năm hiện tại – {{{yearBuilt}}}  
       2. Áp dụng hệ số:  
          - Tuổi < 3 năm  → 1.17  
          - 3–5 năm       → 1.13
          - 5–10 năm      → 1.00  
          - 10–20 năm     → 0.90  
          - lớn hơn 20 năm      → 0.8

4. **Áp dụng hệ số điều chỉnh và xác định giá cuối**  
   - lowValue = reasonableValue × 0.90  (giá bán nhanh)  
   - highValue = reasonableValue × 1.1 (giá bán chậm, ưu đãi)  
   - price_house = Giá trị xây dựng  

5. **Kiểm tra cuối cùng**  
   - Đảm bảo reasonableValue/lotSize nằm trong khoảng 80%–120% giá trung bình thị trường.  
   - Nếu vượt, điều chỉnh về giới hạn gần nhất.

Trả về JSON với đơn vị VND (không có dấu phẩy):
{
  "lowValue": [số nguyên VND],
  "reasonableValue": [số nguyên VND], 
  "highValue": [số nguyên VND],
  "price_house": [số nguyên VND]
}
`,
});

const propertyValuationRangeFlow = ai.defineFlow(
  {
    name: 'propertyValuationRangeFlow',
    inputSchema: PropertyValuationRangeInputSchema,
    outputSchema: PropertyValuationRangeOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    if (!response.output) {
      throw new Error('No output received from AI model');
    }
    return response.output;
  }
);
