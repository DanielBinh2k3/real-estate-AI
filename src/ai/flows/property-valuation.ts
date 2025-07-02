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
  bedrooms: z.number().describe('Số phòng ngủ.'),
  bathrooms: z.number().describe('Số phòng tắm.'),
  lotSize: z.number().describe('Diện tích lô đất (m²).'),
  yearBuilt: z.number().describe('Năm xây dựng bất động sản.'),
  marketData: z.string().describe('Dữ liệu thị trường hiện tại cho các bất động sản tương đương trong khu vực.'),
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
  prompt: `Bạn là chuyên gia định giá bất động sản với hơn 15 năm kinh nghiệm. Hãy thực hiện định giá CHÍNH XÁC dựa trên dữ liệu thị trường thực tế và quy trình chuẩn xác sau:

— **THÔNG TIN BẤT ĐỘNG SẢN**  
- Địa chỉ: {{{address}}}  
- Khu vực: {{{ward}}}, {{{district}}}, {{{city}}} (Cấp {{{administrativeLevel}}})  
- Loại: {{{type}}}  
- Diện tích đất: {{{lotSize}}} m²  
- Diện tích sàn: {{{size}}} m²  
- Số phòng ngủ: {{{bedrooms}}}  
- Số phòng tắm: {{{bathrooms}}}  
- Số tầng: {{{floors}}}  
- Năm xây dựng: {{{yearBuilt}}}  

— **DỮ LIỆU THỊ TRƯỜNG HIỆN TẠI** (bắt buộc tham khảo):  
{{{marketData}}}

— **QUY TRÌNH ĐỊNH GIÁ**  

1. **Phân tích giá thị trường làm baseline**  
   - Lấy giá trung bình từ {{{marketData}}} làm cơ sở.  
   - Giá bất động sản phải nằm trong khoảng ±20% giá thị trường.
2. **Tính giá cơ bản** 
   - Công thức:  
     GIÁ_CƠ_BẢN = GIÁ_TRUNG_BÌNH_THỊ_TRƯỜNG × Diện tích đất ({{{lotSize}}} m²)
   - Giá trị đất = Diện tích đất × Giá đất thị trường × Hệ số vị trí × Hệ số pháp lý  
     - Hệ số vị trí:  
       - Mặt phố lớn: 1.2 – 1.30  
       - Mặt ngõ ô tô tránh: 1.15  
       - Ngõ ô tô một chiều: 1.05 
       - Ngõ nhỏ xe máy: 0.90 – 1.00  
3. **Tính giá trị xây dựng**  
   - Tổng diện tích sàn = Diện tích đất ({{{size}}} m²) × Số tầng ({{{floors}}})  
   - Giá trị xây dựng = Tổng diện tích sàn × Đơn giá xây × Hệ số hao mòn  
     - Đơn giá xây dựng (thành phố lớn):  
       - Nhà 4–5 tầng BTCT: 7–9 triệu/m²  
       - Nhà 2–3 tầng: 6–7 triệu/m²  
       - Nhà cấp 4 hoặc nhà cũ: 4–5 triệu/m²  
     - **Hệ số hao mòn theo tuổi nhà**  
       1. Tính tuổi nhà = Năm hiện tại – {{{yearBuilt}}}  
       2. Áp dụng hệ số:  
          - Tuổi < 3 năm  → 1.20  
          - 3–5 năm       → 1.15  
          - 5–10 năm      → 1.00  
          - 10–20 năm     → 0.90  
          - > 20 năm      → 0.70 – 0.90  

4. **Áp dụng hệ số điều chỉnh và xác định giá cuối**  
   - reasonableValue = Giá cơ bản + Điều chỉnh loại nhà  
   - lowValue = reasonableValue × 0.90  (giá bán nhanh)  
   - highValue = reasonableValue × 1.15 (giá bán chậm, ưu đãi)  
   - price_house = Giá trị xây dựng  

5. **Kiểm tra cuối cùng**  
   - Đảm bảo reasonableValue/lotSize nằm trong khoảng 80%–120% giá trung bình thị trường.  
   - Nếu vượt, điều chỉnh về giới hạn gần nhất.

**VÍ DỤ TÍNH TOÁN:**
Nếu giá thị trường trung bình = 277 triệu VND/m², diện tích = 45m²
→ Giá cơ bản = 277 × 45 = 12.465 tỷ VND
→ Sau điều chỉnh loại nhà (theo các hệ số) = 14.334 tỷ VND  
→ reasonableValue = 14.334.000.000 VND

Trả về JSON với đơn vị VND (không có dấu phẩy):
{
  "lowValue": [số nguyên VND],
  "reasonableValue": [số nguyên VND], 
  "highValue": [số nguyên VND],
  "price_house": [số nguyên VND]
}`,
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
