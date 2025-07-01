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
  prompt: `Bạn là chuyên gia định giá BĐS với 15+ năm kinh nghiệm. Thực hiện định giá CHÍNH XÁC dựa trên dữ liệu thị trường thực tế.

**THÔNG TIN BẤT ĐỘNG SẢN:**
- Địa chỉ: {{{address}}}
- Khu vực: {{{ward}}}, {{{district}}}, {{{city}}} (Cấp {{{administrativeLevel}}})
- Loại: {{{type}}}
- Diện tích đất: {{{lotSize}}} m²
- Diện tích sàn: {{{size}}} m²
- Số phòng ngủ: {{{bedrooms}}}
- Số phòng tắm: {{{bathrooms}}}

**DỮ LIỆU THỊ TRƯỜNG HIỆN TẠI (BẮT BUỘC THAM KHẢO):**
{{{marketData}}}

**QUY TRÌNH ĐỊNH GIÁ CHÍNH XÁC:**

1. **PHÂN TÍCH GIÁ THỊ TRƯỜNG LÀM BASELINE:**
   - Lấy giá trung bình thị trường từ marketData làm cơ sở
   - Giá bất động sản PHẢI nằm trong khoảng ±30% của giá thị trường
   - Nếu marketData không có, sử dụng 280 triệu VND/m² làm baseline

2. **TÍNH TOÁN DIỆN TÍCH VÀ GIÁ CƠ BẢN:**
   - Giá cơ bản = Giá thị trường trung bình (từ marketData) × Diện tích đất ({{{lotSize}}} m²)
   - Công thức: GIÁ_CƠ_BẢN = GIÁ_TRUNG_BÌNH_THỊ_TRƯỜNG × {{{lotSize}}}

3. **ÁP DỤNG HỆ SỐ ĐIỀU CHỈNH:**
   - Loại bất động sản:
     * Nhà mặt phố/town_house: +10% đến +20%
     * Nhà trong hẻm/lane_house: -10% đến -20%
     * Chung cư/apartment: -5% đến +5%
   - Số phòng và tiện ích:
     * +2% cho mỗi phòng ngủ > 2
     * +1% cho mỗi phòng tắm > 1
   - Diện tích sàn:
     * Nếu {{{size}}} > {{{lotSize}}}: +5% (có tầng lửng/nhiều tầng)
     * Nếu {{{size}}} < {{{lotSize}}} × 0.7: -5% (chưa sử dụng hết đất)

4. **XÁC ĐỊNH CÁC MỨC GIÁ:**
   - reasonableValue: Giá cơ bản sau điều chỉnh
   - lowValue: reasonableValue × 0.85 (bán nhanh)
   - highValue: reasonableValue × 1.15 (bán chậm, giá tốt)
   - price_house: reasonableValue × 0.4 (chỉ tính giá xây dựng)

**KIỂM TRA CUỐI CÙNG:**
- Đảm bảo reasonableValue/lotSize nằm trong khoảng 70%-130% giá trung bình thị trường
- Nếu vượt quá khoảng này, điều chỉnh lại về giới hạn gần nhất

**VÍ DỤ TÍNH TOÁN:**
Nếu giá thị trường = 277 triệu VND/m², diện tích = 45m²
→ Giá cơ bản = 277 × 45 = 12.465 tỷ VND
→ Sau điều chỉnh loại nhà (+15%) = 14.334 tỷ VND  
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
