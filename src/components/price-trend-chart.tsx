'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from './ui/skeleton';
import { AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';

// Default mock data for backward compatibility - không sử dụng làm fallback nữa
const defaultChartData = [
    { month: 'T1', price: 65 },
    { month: 'T2', price: 66 },
    { month: 'T3', price: 68 },
    { month: 'T4', price: 67 },
    { month: 'T5', price: 70 },
    { month: 'T6', price: 72 },
    { month: 'T7', price: 73 },
    { month: 'T8', price: 75 },
    { month: 'T9', price: 76 },
    { month: 'T10', price: 78 },
    { month: 'T11', price: 80 },
    { month: 'T12', price: 82 },
];

const chartConfig = {
  price: {
    label: 'Giá/m²',
    color: 'hsl(var(--primary))',
  },
};

const formatTooltipValue = (value: number) => {
    return `${new Intl.NumberFormat('vi-VN').format(value * 1000000)}/m²`;
}

interface PriceTrendChartProps {
  city?: string;
  district?: string;
  category?: string;
  data?: Array<{
    month: string;
    price: number;
    priceRaw?: number;
    count?: number;
    minPrice?: number;
    maxPrice?: number;
    date?: string;
  }>;
  className?: string;
}

export function PriceTrendChart({ 
  city = 'ha_noi', 
  district = 'thanh_xuan', 
  category = 'nha_mat_pho',
  data,
  className = ''
}: PriceTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [hoveredData, setHoveredData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If data is provided as props, use it
    if (data && data.length > 0) {
      setChartData(data);
      setHasRealData(true);
      setIsLoading(false);
      return;
    }

    // If data is explicitly undefined or empty, don't show chart
    if (data !== undefined) {
      setChartData([]);
      setHasRealData(false);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from API
    const fetchTrendData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const mappedCategory = mapPropertyTypeToCategory(category);
        const params = new URLSearchParams({
          city,
          district,
          category: mappedCategory
        });
        
        const response = await fetch(`/api/price-trend?${params}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setChartData(result.data);
          setHasRealData(true);
          
          // Handle fallback information
          if (result.fallback && result.fallbackInfo) {
            setError(`${result.fallbackInfo}`);
          }
        } else {
          // Không có dữ liệu thật
          setChartData([]);
          setHasRealData(false);
          setError('Không có dữ liệu xu hướng giá cho khu vực này');
        }
      } catch (err) {
        console.error('Error fetching trend data:', err);
        setError('Không thể tải dữ liệu xu hướng giá');
        setChartData([]);
        setHasRealData(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendData();
  }, [city, district, category, data, isMounted]);

  const getLocationName = (city: string, district: string) => {
    const cities: Record<string, string> = {
      'ha_noi': 'Hà Nội',
      'ho_chi_minh': 'TP. HCM',
      'da_nang': 'Đà Nẵng'
    };
    
    const districts: Record<string, string> = {
      'thanh_xuan': 'Thanh Xuân',
      'cau_giay': 'Cầu Giấy',
      'dong_da': 'Đống Đa',
      'ba_dinh': 'Ba Đình',
      'hoan_kiem': 'Hoàn Kiếm',
      'hai_ba_trung': 'Hai Bà Trưng'
    };

    const cityName = cities[city] || city.replace('_', ' ');
    const districtName = districts[district] || district.replace('_', ' ');
    
    return `${districtName}, ${cityName}`;
  };

  // Map property type to API category
  const mapPropertyTypeToCategory = (propertyType: string): string => {
    const categoryMap: Record<string, string> = {
      'apartment': 'chung_cu',
      'lane_house': 'nha_hem_ngo', 
      'town_house': 'nha_mat_pho',
      'land': 'ban_dat',
      'villa': 'biet_thu_lien_ke'
    };
    
    return categoryMap[propertyType] || 'nha_mat_pho'; // Default to nha_mat_pho
  };

  // Calculate trend percentage
  const calculateTrend = () => {
    if (!hasRealData || chartData.length < 2) return null;
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const trend = ((lastPrice - firstPrice) / firstPrice) * 100;
    return trend;
  };

  const trend = calculateTrend();

  // Get summary statistics based on hovered data or overall data (all prices are per m²)
  const getSummaryStats = () => {
    if (!hasRealData || chartData.length === 0) return null;
    
    if (hoveredData) {
      // Show data for the hovered month - all values are per m²
      return {
        current: hoveredData.price, // Price per m² in millions VND
        min: hoveredData.minPrice ? Math.round(hoveredData.minPrice / 1000000) : hoveredData.price * 0.8,
        max: hoveredData.maxPrice ? Math.round(hoveredData.maxPrice / 1000000) : hoveredData.price * 1.2,
        month: hoveredData.month,
        count: hoveredData.count
      };
    } else {
      // Show overall statistics - calculate average price per m² across all months
      const pricesPerSqm = chartData.map(d => d.price); // All prices are per m² in millions VND
      return {
        current: Math.round(pricesPerSqm.reduce((sum, p) => sum + p, 0) / pricesPerSqm.length), // Average price per m²
        min: Math.min(...pricesPerSqm), // Min price per m²
        max: Math.max(...pricesPerSqm), // Max price per m²
        month: null,
        count: null
      };
    }
  };

  const stats = getSummaryStats();

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <BarChart3 className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Không có xu hướng giá
      </h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Chưa có đủ dữ liệu giao dịch để hiển thị xu hướng giá cho khu vực {getLocationName(city, district)}
      </p>
    </div>
  );

  return (
    <Card className={`bg-gradient-to-br from-slate-50 via-white to-blue-50 border-blue-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="font-headline flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-slate-800">Phân tích Xu hướng giá</h3>
            <p className="text-sm text-slate-600 font-normal mt-1">
              Đơn giá/m² khu vực {getLocationName(city, district)} (12 tháng qua)
            </p>
          </div>
        </CardTitle>
        
        {/* Trend indicator - only show when has real data */}
        {trend !== null && hasRealData && (
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              trend >= 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-slate-500">
              so với {chartData.length} tháng trước
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Error/Fallback notification */}
        {error && hasRealData && (
          <div className="bg-blue-50 border-blue-200 border rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                {error}. Hiển thị dữ liệu tương tự từ khu vực.
              </p>
            </div>
          </div>
        )}

        {!isMounted || isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !hasRealData ? (
          <EmptyState />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                onMouseLeave={() => setHoveredData(null)}
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="priceGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}tr`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      // Update hovered data state
                      if (hoveredData?.month !== data.month) {
                        setHoveredData(data);
                      }
                      return (
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
                          <p className="font-medium text-slate-800 mb-2">{label}</p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-slate-600">Giá trung bình/m²: </span>
                              <span className="font-semibold text-amber-600">
                                {formatTooltipValue(payload[0].value as number)}
                              </span>
                            </p>
                            {data.count && (
                              <p className="text-sm">
                                <span className="text-slate-600">Số giao dịch: </span>
                                <span className="font-medium">{data.count}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#priceGradient)"
                  dot={{ 
                    fill: "#f59e0b", 
                    strokeWidth: 2, 
                    stroke: "#ffffff",
                    r: 4 
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: "#d97706",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Interactive summary statistics - only show when has real data */}
        {!isLoading && hasRealData && chartData.length > 0 && stats && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            {/* Header for interactive stats */}
            <div className="text-center mb-3">
              <p className="text-sm font-medium text-slate-700">
                {hoveredData ? (
                  <>Thông tin tháng <span className="text-amber-600 font-semibold">{hoveredData.month}</span></>
                ) : (
                  <>Thống kê tổng quan</>
                )}
              </p>
              {hoveredData && hoveredData.count && (
                <p className="text-xs text-slate-500 mt-1">
                  {hoveredData.count} giao dịch trong tháng
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-1">
                  {hoveredData ? 'Thấp nhất/m²' : 'Thấp nhất/m²'}
                </p>
                <p className="font-semibold text-emerald-600">
                  {formatTooltipValue(stats.min)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-1">
                  {hoveredData ? 'Cao nhất/m²' : 'Cao nhất/m²'}
                </p>
                <p className="font-semibold text-red-600">
                  {formatTooltipValue(stats.max)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-1">
                  {hoveredData ? 'Trung bình/m²' : 'Trung bình/m²'}
                </p>
                <p className="font-semibold text-blue-600">
                  {formatTooltipValue(stats.current)}
                </p>
              </div>
            </div>

            {/* Helpful tip */}
            {!hoveredData && (
              <div className="text-center mt-3">
                <p className="text-xs text-slate-400">
                  💡 Di chuyển chuột lên biểu đồ để xem thông tin chi tiết từng tháng
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
