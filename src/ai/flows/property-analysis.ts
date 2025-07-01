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
- Thị trường: {{{marketData}}}
- Khu vực: {{{ward}}}, {{{district}}}, {{{city}}} (Cấp {{{administrativeLevel}}})

**Yêu cầu:**
Kết hợp thông tin tìm kiếm 2025 + chính sách mới + input để tạo 5 điểm (1-10) + 5 mô tả ngắn (1 câu/mục):
1. legalityScore – dựa trên *legal* + luật đất đai/chính sách BĐS mới nhất 2025
2. liquidityScore – theo *laneWidth, facadeWidth* + xu hướng thị trường 2025
3. locationScore – theo khu vực + tiện ích xung quanh + quy hoạch 2025
4. evaluationScore – theo *marketData* + giá thị trường + chính sách thuế 2025
5. dividendScore – tiềm năng cho thuê/bán + xu hướng đầu tư BĐS 2025

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
