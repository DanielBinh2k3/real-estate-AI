'use client';

import { extractAIData, extractKeyInsights, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

// Your JSON data
const rawAIData = {
  "input_coordinates": [10.77650017960953, 106.69811367988588],
  "ai_valuation": {
    "success": true,
    "result": {
      "valuation": {
        "highValue": 4976004000,
        "lowValue": 3677916000,
        "price_house": 1730784000,
        "reasonableValue": 4326960000
      },
      "property_info": {
        "address": "10°46'35.4\"N 106°41'53.2\"E, Phường Bến Thành, Quận 1, Hồ Chí Minh",
        "location": {
          "city": "ho_chi_minh",
          "district": "quan_1",
          "ward": "ben_thanh"
        },
        "specifications": {
          "type": "lane_house",
          "land_area": 33,
          "house_area": 33,
          "bedrooms": 3,
          "bathrooms": 2,
          "lane_width": 3,
          "facade_width": 3,
          "story_number": 4,
          "legal": "contract"
        }
      },
      "market_context": {
        "category": "nha_hem_ngo",
        "data_source": "API"
      }
    }
  },
  "ai_analysis": {
    "success": true,
    "result": {
      "radarScore": {
        "descriptions": [
          "Tình trạng pháp lý 'hợp đồng' tiềm ẩn rủi ro và không đảm bảo quyền sở hữu đầy đủ theo Luật Đất đai mới có hiệu lực năm 2025.",
          "Thanh khoản rất tốt nhờ vị trí trung tâm Quận 1 và xu hướng tăng giá mạnh của thị trường, dù lộ giới hẻm có phần hạn chế.",
          "Vị trí cực kỳ đắc địa tại trung tâm Quận 1, tiếp cận mọi tiện ích và hạ tầng vượt trội, đảm bảo giá trị lâu dài.",
          "Giá trị thẩm định cao, phản ánh đúng xu hướng tăng trưởng mạnh của thị trường Quận 1 và giá giao dịch thực tế.",
          "Tiềm năng sinh lời vượt trội từ cả cho thuê và tăng giá vốn, đặc biệt trong bối cảnh thị trường đang phục hồi tích cực."
        ],
        "dividendScore": 9,
        "evaluationScore": 9,
        "legalityScore": 2,
        "liquidityScore": 8,
        "locationScore": 10
      }
    }
  },
  "success": true,
  "error": null
};

export default function DemoExtractPage() {
  const [selectedTab, setSelectedTab] = useState<'raw' | 'transformed' | 'insights'>('insights');

  // Transform data to match component expectations
  const transformedData = extractAIData(rawAIData);
  
  // Extract key insights
  const insights = extractKeyInsights(rawAIData);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">Demo: Extract AI Data</h1>
        <p className="text-slate-600">Cách lấy thông tin từ ai_analysis và ai_valuation</p>
        
        {/* Tab Buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSelectedTab('insights')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'insights' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Key Insights
          </button>
          <button
            onClick={() => setSelectedTab('transformed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'transformed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Transformed Data
          </button>
          <button
            onClick={() => setSelectedTab('raw')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'raw' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Raw Data
          </button>
        </div>
      </div>

      {/* Key Insights Tab */}
      {selectedTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Valuation Insights */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-emerald-700">💰 Thông tin định giá</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-600 font-medium">Giá thấp nhất</p>
                  <p className="text-xl font-bold text-emerald-700">{insights.valuation.formattedLow}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-600 font-medium">Giá phù hợp</p>
                  <p className="text-xl font-bold text-emerald-700">{insights.valuation.formattedReasonable}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-600 font-medium">Giá cao nhất</p>
                  <p className="text-xl font-bold text-emerald-700">{insights.valuation.formattedHigh}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-600 font-medium">Giá nhà</p>
                  <p className="text-xl font-bold text-emerald-700">{insights.valuation.formattedPriceHouse}</p>
                </div>
              </div>
              
              {/* Property Info */}
              <div className="bg-white p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-700 mb-2">Thông tin BĐS:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Địa chỉ:</strong> {rawAIData.ai_valuation?.result?.property_info?.address || 'N/A'}</p>
                  <p><strong>Loại:</strong> {rawAIData.ai_valuation?.result?.property_info?.specifications?.type || 'N/A'}</p>
                  <p><strong>Diện tích:</strong> {rawAIData.ai_valuation?.result?.property_info?.specifications?.land_area || 0}m²</p>
                  <p><strong>Phòng ngủ:</strong> {rawAIData.ai_valuation?.result?.property_info?.specifications?.bedrooms || 0}</p>
                  <p><strong>Phòng tắm:</strong> {rawAIData.ai_valuation?.result?.property_info?.specifications?.bathrooms || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Insights */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-purple-700">📊 Phân tích đánh giá</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Điểm tổng hợp</p>
                <p className="text-3xl font-bold text-purple-700">{insights.analysis.overallScore.toFixed(1)}/10</p>
              </div>

              {/* Individual Scores */}
              <div className="space-y-2">
                {[
                  { label: 'Vị trí', score: insights.analysis.locationScore, color: 'emerald' },
                  { label: 'Pháp lý', score: insights.analysis.legalityScore, color: 'blue' },
                  { label: 'Thanh khoản', score: insights.analysis.liquidityScore, color: 'amber' },
                  { label: 'Thẩm định', score: insights.analysis.evaluationScore, color: 'purple' },
                  { label: 'Sinh lời', score: insights.analysis.dividendScore, color: 'red' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${item.color}-500 transition-all`}
                          style={{ width: `${(item.score / 10) * 100}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="min-w-[40px] text-center">
                        {item.score}/10
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Descriptions */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-700 mb-2">Mô tả chi tiết:</h4>
                <div className="space-y-2 text-sm">
                  {insights.analysis.descriptions.map((desc, index) => (
                    <p key={index} className="text-slate-600">• {desc}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transformed Data Tab */}
      {selectedTab === 'transformed' && (
        <Card>
          <CardHeader>
            <CardTitle>🔄 Transformed Data (Component-Ready)</CardTitle>
            <p className="text-sm text-slate-600">Dữ liệu đã được transform để phù hợp với components</p>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(transformedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Tab */}
      {selectedTab === 'raw' && (
        <Card>
          <CardHeader>
            <CardTitle>📄 Raw Data</CardTitle>
            <p className="text-sm text-slate-600">Dữ liệu gốc từ API</p>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(rawAIData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Usage Example */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-700">🚀 Cách sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-2">1. Import helper functions:</h4>
            <pre className="bg-slate-100 p-2 rounded text-sm">
{`import { extractAIData, extractKeyInsights } from '@/lib/utils';`}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-2">2. Transform data:</h4>
            <pre className="bg-slate-100 p-2 rounded text-sm">
{`// For components (RightPanelValuation, RightPanelRadarChart)
const transformedData = extractAIData(rawData);

// For easy access to values
const insights = extractKeyInsights(rawData);`}
            </pre>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-2">3. Sử dụng trong components:</h4>
            <pre className="bg-slate-100 p-2 rounded text-sm">
{`// Valuation values
console.log(insights.valuation.formattedReasonable); // "4.3 Tỷ"
console.log(insights.valuation.reasonableValue);     // 4326960000

// Analysis scores  
console.log(insights.analysis.overallScore);        // 7.6
console.log(insights.analysis.locationScore);       // 10
console.log(insights.analysis.descriptions);        // Array of descriptions`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 