'use client';

import { PolarGrid, PolarAngleAxis, Radar, RadarChart, PolarRadiusAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import type { SummaryDetails, CombinedResult } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { BarChart3, Sparkles, Award, Target } from 'lucide-react';
import { Badge } from './ui/badge';

type RightPanelRadarChartProps = {
  result: CombinedResult;
};

export function RightPanelRadarChart({ result }: RightPanelRadarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if it's API result or old format
  const isApiResult = 'valuation_result' in result;
  
  let chartData: { criterion: string; score: number; color: string }[] = [];
  
  // Extract radarScore from ai_analysis
  const radarScoreAI = isApiResult && result.ai_analysis?.success ? (
    result.ai_analysis.data?.radarScore ?? result.ai_analysis.result?.radarScore
  ) : null;
  
  // Check for AI analysis data first, then valuation_result
  if (radarScoreAI) {
    const radarScore = radarScoreAI;
    chartData = [
      { criterion: 'Vị trí', score: radarScore.locationScore, color: '#10b981' },
      { criterion: 'Pháp lý', score: radarScore.legalityScore, color: '#3b82f6' },
      { criterion: 'Thanh khoản', score: radarScore.liquidityScore, color: '#f59e0b' },
      { criterion: 'Thẩm định', score: radarScore.evaluationScore, color: '#8b5cf6' },
      { criterion: 'Sinh lời', score: radarScore.dividendScore, color: '#ef4444' },
    ];
  } else if (isApiResult && result.valuation_result?.evaluation?.radarScore) {
    const radarScore = result.valuation_result.evaluation.radarScore;
    chartData = [
      { criterion: 'Vị trí', score: radarScore.locationScore, color: '#10b981' },
      { criterion: 'Pháp lý', score: radarScore.legalityScore, color: '#3b82f6' },
      { criterion: 'Thanh khoản', score: radarScore.liquidityScore, color: '#f59e0b' },
      { criterion: 'Sinh lời', score: radarScore.dividendScore, color: '#ef4444' },
    ];
  } else if (!isApiResult && result.summary) {
    // Fallback to old format
    chartData = [
      { criterion: 'Vị trí', score: result.summaryDetails?.location?.score || 7, color: '#10b981' },
      { criterion: 'Pháp lý', score: result.summaryDetails?.legal?.score || 8, color: '#3b82f6' },
      { criterion: 'Thanh khoản', score: result.summaryDetails?.utilities?.score || 6, color: '#f59e0b' },
      { criterion: 'Chất lượng', score: result.summaryDetails?.quality?.score || 7, color: '#8b5cf6' },
      { criterion: 'Quy hoạch', score: result.summaryDetails?.planning?.score || 8, color: '#ef4444' },
    ];
  }

  // Calculate overall score and performance level
  const overallScore = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length 
    : 0;

  const getPerformanceLevel = (score: number) => {
    if (score >= 8) return { 
      level: 'Xuất sắc', 
      color: 'emerald', 
      icon: Award,
      badgeClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg border-emerald-300',
      textClass: 'text-emerald-600'
    };
    if (score >= 6.5) return { 
      level: 'Tốt', 
      color: 'blue', 
      icon: Target,
      badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-blue-300',
      textClass: 'text-blue-600'
    };
    if (score >= 5) return { 
      level: 'Trung bình', 
      color: 'yellow', 
      icon: BarChart3,
      badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border-amber-300',
      textClass: 'text-amber-600'
    };
    return { 
      level: 'Cần cải thiện', 
      color: 'red', 
      icon: BarChart3,
      badgeClass: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg border-red-300',
      textClass: 'text-red-600'
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6.5) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-50 border-emerald-200';
    if (score >= 6.5) return 'bg-blue-50 border-blue-200';
    if (score >= 5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const performance = getPerformanceLevel(overallScore);
  const PerformanceIcon = performance.icon;

  // If no data available
  if (chartData.length === 0) {
    return (
      <Card className="professional-card bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Chấm điểm BĐS</h3>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-sm text-slate-600 font-normal">Đánh giá đa tiêu chí</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="mx-auto aspect-square h-64 flex items-center justify-center pb-6">
            <div className="text-center">
              <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
              <p className="text-sm text-slate-500">Đang phân tích dữ liệu...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">Chấm điểm BĐS</h3>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-sm text-slate-600 font-normal">Đánh giá đa tiêu chí</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isMounted ? (
          <>
            {/* Overall Score Display */}
            <div className={`relative p-6 rounded-2xl border-2 ${getScoreBg(overallScore)} shadow-inner`}>
              <div className="absolute -top-3 left-6">
                <Badge className={`${performance.badgeClass} font-bold text-sm px-3 py-1.5 border-2`}>
                  <PerformanceIcon className="h-3.5 w-3.5 mr-1.5" />
                  {performance.level.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center pt-2">
                <p className="text-sm text-slate-600 font-medium mb-2">Điểm tổng hợp</p>
                <p className={`text-4xl font-black tracking-tight ${performance.textClass} drop-shadow-sm`}>
                  {overallScore.toFixed(1)}/10
                </p>
              </div>
            </div>

            {/* Radar Chart */}
            <ChartContainer
              config={{
                score: {
                  label: 'Điểm',
                  color: 'hsl(var(--primary))',
                },
              }}
              className="mx-auto aspect-square h-64"
            >
              <RadarChart
                data={chartData}
                margin={{
                  top: 40,
                  right: 40,
                  bottom: 40,
                  left: 40,
                }}
              >
                <PolarGrid 
                  gridType="polygon" 
                  stroke="#e2e8f0" 
                  strokeWidth={1}
                  fill="rgba(248, 250, 252, 0.5)"
                />
                <PolarAngleAxis 
                  dataKey="criterion" 
                  tick={{ 
                    fontSize: 13, 
                    fill: '#1e293b', 
                    fontWeight: 600,
                    dy: 4
                  }}
                  axisLineType="polygon"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tick={false}
                />
                <Radar
                  dataKey="score"
                  fill="url(#gradient)"
                  fillOpacity={0.3}
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{
                    r: 6,
                    fillOpacity: 1,
                    fill: 'hsl(var(--primary))',
                    stroke: 'white',
                    strokeWidth: 2,
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ChartContainer>
            
            {/* Detailed Scores */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Chi tiết từng tiêu chí
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {chartData.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md ${getScoreBg(item.score)} shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">{item.criterion}</p>
                      <div 
                        className="w-3.5 h-3.5 rounded-full shadow-sm border border-white"
                        style={{ backgroundColor: item.color }}
                      ></div>
                    </div>
                    <p className={`text-xl font-black ${getScoreColor(item.score)} drop-shadow-sm`}>
                      {item.score.toFixed(1)}
                    </p>
                    <div className="mt-3 bg-slate-200 rounded-full h-2 shadow-inner">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 shadow-sm"
                        style={{ 
                          width: `${(item.score/10)*100}%`,
                          backgroundColor: item.color 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto aspect-square h-64 flex items-center justify-center pb-6">
            <div className="text-center">
              <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
              <p className="text-sm text-slate-500">Đang tải biểu đồ...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 