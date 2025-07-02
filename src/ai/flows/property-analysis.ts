'use server';
/**
 * @fileOverview Generates comprehensive property analysis with radar scoring and detailed descriptions.
 *
 * - propertyAnalysis - A function that generates the property analysis with radar scores.
 * - PropertyAnalysisInput - The input type for the propertyAnalysis function.
 * - PropertyAnalysisOutput - The return type for the propertyAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyAnalysisInputSchema = z.object({
  address: z.string().describe('Địa chỉ chi tiết của bất động sản (có thể để trống nếu đã cung cấp city/district/ward).').optional(),
  city: z.string().describe('Thành phố/Tỉnh.'),
  district: z.string().describe('Quận/Huyện.'),
  ward: z.string().describe('Phường/Xã.'),
  administrativeLevel: z.number().describe('Cấp hành chính (0: đô thị trung ương, 1: tỉnh, ...).'),
  type: z.string().describe('Loại bất động sản (ví dụ: lane_house, apartment, NORMAL, v.v.).'),
  size: z.number().describe('Diện tích sàn (m²).'),
  bedrooms: z.number().describe('Số lượng phòng ngủ.'),
  bathrooms: z.number().describe('Số lượng phòng tắm.'),
  lotSize: z.number().describe('Diện tích lô đất (m²).'),
  landArea: z.number().describe('Diện tích đất (m²).'),
  houseArea: z.number().describe('Diện tích sàn xây dựng (m²).'),
  laneWidth: z.number().describe('Chiều rộng hẻm/đường vào (m).'),
  facadeWidth: z.number().describe('Chiều rộng mặt tiền (m).'),
  storyNumber: z.number().describe('Số tầng của bất động sản.'),
  legal: z.string().describe('Tình trạng pháp lý (sổ đỏ, hợp đồng, v.v.).'),
  yearBuilt: z.number().describe('Năm xây dựng bất động sản.'),
  marketData: z.string().describe('Dữ liệu thị trường hiện tại cho các bất động sản tương đương trong khu vực.'),
});
export type PropertyAnalysisInput = z.infer<typeof PropertyAnalysisInputSchema>;

const PropertyAnalysisOutputSchema = z.object({
  radarScore: z.object({
    legalityScore: z.number().describe('Điểm pháp lý của bất động sản (1-10).'),
    liquidityScore: z.number().describe('Điểm thanh khoản của bất động sản (1-10).'),
    locationScore: z.number().describe('Điểm vị trí của bất động sản (1-10).'),
    evaluationScore: z.number().describe('Điểm thẩm định giá của bất động sản (1-10).'),
    dividendScore: z.number().describe('Điểm lợi nhuận/sinh lời của bất động sản (1-10).'),
    descriptions: z.array(z.string()).describe('5 mô tả chi tiết tương ứng với từng điểm số: pháp lý, thanh khoản, vị trí, thẩm định giá, lợi nhuận.'),
  }),
});
export type PropertyAnalysisOutput = z.infer<typeof PropertyAnalysisOutputSchema>;

export async function propertyAnalysis(input: PropertyAnalysisInput): Promise<PropertyAnalysisOutput> {
  return propertyAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyAnalysisPrompt',
  input: {schema: PropertyAnalysisInputSchema},
  output: {schema: PropertyAnalysisOutputSchema},
  prompt: `Phân tích BĐS và tạo radar score (5 tiêu chí). Dựa trên thông tin đầu vào và dữ liệu thị trường:

**Thông tin từ input:**
- Loại: {{{type}}}
- Địa chỉ: {{{address}}}
- Đất/Nhà: {{{landArea}}}m² / {{{houseArea}}}m²
- Lộ giới/Mặt tiền: {{{laneWidth}}}m / {{{facadeWidth}}}m
- Tầng: {{{storyNumber}}} | Phòng: {{{bedrooms}}}N-{{{bathrooms}}}T
- Pháp lý: {{{legal}}}
- Năm xây dựng: {{{yearBuilt}}}
- Thị trường: {{{marketData}}}
- Khu vực: {{{ward}}}, {{{district}}}, {{{city}}} (Cấp {{{administrativeLevel}}})

**Yêu cầu:**
Phân tích chi tiết từ marketData (giá trung bình, số giao dịch theo năm) + thông tin input để tạo 5 điểm (1-10) + 5 mô tả ngắn (1 câu/mục):

1. **legalityScore** – Phân tích theo loại sổ:
   - Sổ đỏ (red_book): 9-10 điểm (pháp lý hoàn hảo)
   - Sổ hồng (pink_book): 7-8 điểm (pháp lý tốt, có thể chuyển đổi)
   - Hợp đồng (contract): 4-6 điểm (rủi ro pháp lý cao)
   - Sổ trắng (white_book): 2-4 điểm (không được công nhận)

2. **liquidityScore** – Dựa trên marketData (số giao dịch/năm) + đặc điểm vật lý:
   - Phân tích xu hướng giao dịch từ marketData
   - Mặt tiền rộng ({{{facadeWidth}}}m) + đường rộng ({{{laneWidth}}}m) = thanh khoản cao
   - Loại nhà phổ biến (lane_house, apartment) = dễ bán hơn villa, đất trống

3. **locationScore** – Phân tích địa danh cụ thể:
   - Tên đường/phố trong {{{address}}} (đường lớn = điểm cao)
   - Phường {{{ward}}} + Quận {{{district}}} + TP {{{city}}} (trung tâm = điểm cao)
   - Cấp hành chính {{{administrativeLevel}}} (0=TW cao nhất, 1=tỉnh thấp hơn)

4. **evaluationScore** – Dựa trên marketData chi tiết:
   - So sánh giá hiện tại với giá trung bình trong marketData
   - Phân tích biến động giá theo loại BĐS ({{{type}}})
   - Đánh giá độ chính xác định giá dựa trên số lượng giao dịch tham khảo

5. **dividendScore** – Tiềm năng sinh lời từ marketData:
   - Xu hướng tăng/giảm giá từ dữ liệu lịch sử trong marketData
   - Tỷ suất cho thuê theo loại nhà và vị trí cụ thể
   - Tiềm năng tăng giá dựa trên số giao dịch và thanh khoản thị trường

Trả về object radarScore (5 score + descriptions). Tiếng Việt, súc tích.`,
});

const propertyAnalysisFlow = ai.defineFlow(
  {
    name: 'propertyAnalysisFlow',
    inputSchema: PropertyAnalysisInputSchema,
    outputSchema: PropertyAnalysisOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    if (!response.output) {
      throw new Error('No output received from AI model');
    }
    return response.output;
  }
);
