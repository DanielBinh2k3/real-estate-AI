'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Home,
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Star,
  Building,
  Ruler,
  Calendar,
  Target,
  AlertTriangle,
  Bed,
  Bath,
  Layers,
  Move,
  Car,
  Shield,
  FileCheck,
  Users,
  Heart,
  Lightbulb
} from 'lucide-react';
import { UtilitiesInteractiveMap } from '@/components/utilities-interactive-map';
import { PriceTrendChart } from '@/components/price-trend-chart';

interface ValuationResultProps {
  data: any;
}

export function ValuationResultDisplay({ data }: ValuationResultProps) {
  const hasEvaluation = !!data?.valuation_result?.evaluation;

  let result: any = null;
  let address: any = null;
  let radarScore: any = null;
  let isMockData = false;
  let isAIEnhanced = false;

  if (hasEvaluation) {
    result = data.valuation_result.evaluation;
    address = result.address;
    radarScore = result.radarScore;
    isMockData = data.error && data.error.includes('mock');
  } else {
    // Fallback to AI valuation & analysis
    const aiValuationData = data.ai_valuation?.result?.valuation ?? data.ai_valuation?.data;
    const propertyInfo = data.ai_valuation?.result?.property_info;
    const radar = data.ai_analysis?.result?.radarScore ?? data.ai_analysis?.data?.radarScore;

    if (!aiValuationData) {
      return null; // no data to render
    }

    isAIEnhanced = true;

    result = {
      totalPrice: aiValuationData.reasonableValue,
      housePrice: aiValuationData.price_house,
      landArea: propertyInfo?.specifications?.land_area ?? 0,
      type: propertyInfo?.specifications?.type ?? 'lane_house'
    };

    address = {
      city: propertyInfo?.location?.city ?? '',
      district: propertyInfo?.location?.district ?? '',
      ward: propertyInfo?.location?.ward ?? '',
    };

    radarScore = radar ?? {
      locationScore: 0,
      legalityScore: 0,
      liquidityScore: 0,
      evaluationScore: 0,
      dividendScore: 0,
      descriptions: []
    };
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Tính khoảng giá +/- 10%
  const calculatePriceRange = (basePrice: number) => {
    const minPrice = basePrice * 0.9; // -10%
    const maxPrice = basePrice * 1.1; // +10%
    return { minPrice, maxPrice, basePrice };
  };

  const formatPriceRange = (price: number) => {
    const billions = Math.floor(price / 1000000000);
    const millions = Math.floor((price % 1000000000) / 1000000);
    
    if (billions > 0) {
      if (millions > 0) {
        return `${billions} tỷ ${Math.round(millions / 100) * 100 / 1000} triệu`;
      }
      return `${billions} tỷ`;
    } else {
      return `${Math.round(millions / 100) * 100} triệu`;
    }
  };

  const getPropertyType = (type: string) => {
    const types: Record<string, string> = {
      'town_house': 'Nhà phố',
      'apartment': 'Chung cư',
      'villa': 'Biệt thự',
      'house': 'Nhà riêng'
    };
    return types[type] || type;
  };

  const getDistrictName = (district: string) => {
    const districts: Record<string, string> = {
      'cau_giay': 'Cầu Giấy',
      'dong_da': 'Đống Đa',
      'ba_dinh': 'Ba Đình',
      'hoan_kiem': 'Hoàn Kiếm',
      'hai_ba_trung': 'Hai Bà Trưng',
      'thanh_xuan': 'Thanh Xuân'
    };
    return districts[district] || district.replace('_', ' ');
  };

  const getCityName = (city: string) => {
    const cities: Record<string, string> = {
      'ha_noi': 'Hà Nội',
      'ho_chi_minh': 'TP. Hồ Chí Minh',
      'da_nang': 'Đà Nẵng'
    };
    return cities[city] || city.replace('_', ' ');
  };

  // Function to get appropriate icon for AI analysis descriptions
  const getAnalysisIcon = (description: string, index: number) => {
    const desc = description.toLowerCase();
    
    // Check for location/position related content
    if (desc.includes('vị trí') || desc.includes('tiện ích') || desc.includes('trường học') || desc.includes('bệnh viện') || desc.includes('trung tâm')) {
      return <MapPin className="h-4 w-4 text-blue-600" />;
    }
    
    // Check for legal/contract related content
    if (desc.includes('hợp đồng') || desc.includes('pháp lý') || desc.includes('sổ') || desc.includes('đảm bảo') || desc.includes('minh bạch')) {
      return <FileCheck className="h-4 w-4 text-green-600" />;
    }
    
    // Check for family/living related content
    if (desc.includes('gia đình') || desc.includes('phòng ngủ') || desc.includes('phòng tắm') || desc.includes('sinh hoạt') || desc.includes('phù hợp')) {
      return <Users className="h-4 w-4 text-purple-600" />;
    }
    
    // Check for investment/financial related content
    if (desc.includes('đầu tư') || desc.includes('thanh khoản') || desc.includes('sinh lời') || desc.includes('giá') || desc.includes('thời gian')) {
      return <TrendingUp className="h-4 w-4 text-amber-600" />;
    }
    
    // Default icons based on index if no keywords match
    const defaultIcons = [
      <MapPin className="h-4 w-4 text-blue-600" />,
      <FileCheck className="h-4 w-4 text-green-600" />,
      <Users className="h-4 w-4 text-purple-600" />,
      <Lightbulb className="h-4 w-4 text-orange-600" />
    ];
    
    return defaultIcons[index % defaultIcons.length];
  };

  return (
    <div className="space-y-6">
      {/* Mock Data Warning */}
      {isMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h4 className="text-amber-800 font-medium">Dữ liệu mẫu</h4>
              <p className="text-amber-700 text-sm mt-1">
                Kết quả này sử dụng dữ liệu mẫu do vấn đề kết nối API. Vui lòng thử lại sau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Valuation Result */}
      <Card className="professional-card border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-slate-800">Kết quả định giá bất động sản</h2>
              <p className="text-sm text-slate-600 font-normal mt-1">Phân tích chi tiết bởi AI</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Price Display */}
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-slate-600 font-medium mb-2">Tổng giá trị bất động sản</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(result.totalPrice)}
              </p>
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-slate-600">Giá theo m²: </span>
                <span className="font-semibold text-emerald-600">
                  {result.landArea ? formatCurrency(Math.round(result.totalPrice / result.landArea)) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-600">Giá nhà: </span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(result.housePrice)}
                </span>
              </div>
            </div>
          </div>



        </CardContent>
      </Card>

      {/* Gợi ý giá bán - Sử dụng AI Valuation nếu có */}
      {(() => {
        // Use AI valuation range if available, otherwise fallback to calculated range
        const aiVal = data.ai_valuation?.result?.valuation ?? data.ai_valuation?.data;

        const priceRange = (isAIEnhanced && aiVal) ? {
          minPrice: aiVal.lowValue,
          basePrice: aiVal.reasonableValue,
          maxPrice: aiVal.highValue
        } : calculatePriceRange(result.totalPrice);
        
        return (
          <Card className="professional-card bg-gradient-to-br from-blue-900 to-blue-700 text-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg">
                  <span className="text-white text-xs font-bold">💰</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Gợi ý giá bán
                  </h3>
                </div>
              </div>

                {/* Price Range Labels */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white"> 
                      {formatPriceRange(priceRange.minPrice)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {formatPriceRange(priceRange.maxPrice)}
                    </p>
                  </div>
                </div>

                {/* Price Range Bar */}
                <div className="relative mb-6">
                  <div className="h-3 bg-gradient-to-r from-emerald-500 to-red-500 rounded-full">
                  </div>
                  {/* Center point indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-400 shadow-lg"></div>
                  </div>
                  {/* Center price label */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white text-gray-800 px-3 py-1 rounded-lg text-sm font-semibold shadow-lg whitespace-nowrap">
                      {formatPriceRange(priceRange.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm">
                      Khoảng giá giúp bạn bán nhanh hơn
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm">
                      Khoảng giá giúp bạn bán với giá tốt nhất nhưng có thể sẽ chậm hơn đôi chút
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
        );
      })()}

      {/* Price Trend Chart - Thêm sau gợi ý giá bán */}
      {data.price_trend && (
        <PriceTrendChart 
          city={address.city}
          district={address.district}
          category={result.type || 'town_house'}
          data={data.price_trend.success ? data.price_trend.data : undefined}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-sm">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-slate-800">Thông tin vị trí</h3>
                <p className="text-sm text-slate-600 font-normal">Chi tiết địa lý</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thành phố:</span>
                <Badge variant="secondary">{getCityName(address.city || '')}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Quận/Huyện:</span>
                <Badge variant="secondary">{getDistrictName(address.district || '')}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phường/Xã:</span>
                <Badge variant="outline">{address.ward ? address.ward.replace('_', ' ') : '—'}</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Khoảng cách trung tâm TP:</span>
                <span className="font-semibold text-emerald-600">
                  {result.cityCenterDistance ? result.cityCenterDistance.toFixed(1) + ' km' : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Khoảng cách trung tâm quận:</span>
                <span className="font-semibold text-emerald-600">
                  {result.districtCenterDistance ? result.districtCenterDistance.toFixed(1) + ' km' : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg shadow-sm">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-slate-800">Đánh giá chi tiết</h3>
                <p className="text-sm text-slate-600 font-normal">Chấm điểm tổng quan</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Điểm vị trí</span>
                  <span className="font-semibold text-blue-600">{radarScore.locationScore}/10</span>
                </div>
                <Progress value={radarScore.locationScore * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Điểm pháp lý</span>
                  <span className="font-semibold text-green-600">{radarScore.legalityScore}/10</span>
                </div>
                <Progress value={radarScore.legalityScore * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Điểm thanh khoản</span>
                  <span className="font-semibold text-orange-600">{radarScore.liquidityScore}/10</span>
                </div>
                <Progress value={radarScore.liquidityScore * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Tiềm năng sinh lời</span>
                  <span className="font-semibold text-purple-600">{radarScore.dividendScore}/10</span>
                </div>
                <Progress value={radarScore.dividendScore * 10} className="h-2" />
              </div>
              
              <Separator />
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Điểm tổng quan:</span>
                  <span className="text-xl font-bold text-primary">
                    {radarScore.evaluationScore}/10
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phân tích từ AI */}
      {radarScore.descriptions && radarScore.descriptions.length > 0 && (
        <Card className="professional-card bg-gradient-to-br from-violet-50 via-white to-blue-50 border-violet-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-slate-800">Phân tích từ AI</h3>
                <p className="text-sm text-slate-600 font-normal">Đánh giá chuyên sâu</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {radarScore.descriptions.map((desc: string, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0 mt-0.5">
                      {getAnalysisIcon(desc, index)}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
            )}

      {/* Đặc điểm bất động sản - Thông tin từ user */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg shadow-sm">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-slate-800">Đặc điểm bất động sản</h3>
              <p className="text-sm text-slate-600 font-normal">Thông số kỹ thuật</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Building className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-slate-600 mb-1">Loại hình</p>
              <p className="text-lg font-semibold text-slate-800">{getPropertyType(result.type)}</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Ruler className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-xs text-slate-600 mb-1">Diện tích đất</p>
              <p className="text-lg font-semibold text-slate-800">{result.landArea}m²</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Home className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-xs text-slate-600 mb-1">Diện tích nhà</p>
              <p className="text-lg font-semibold text-slate-800">{result.houseArea}m²</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-xs text-slate-600 mb-1">Năm xây dựng</p>
              <p className="text-lg font-semibold text-slate-800">{result.year}</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Bed className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-slate-600 mb-1">Phòng ngủ</p>
              <p className="text-lg font-semibold text-slate-800">{result.bedRoom}</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Bath className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-xs text-slate-600 mb-1">Phòng tắm</p>
              <p className="text-lg font-semibold text-slate-800">{result.bathRoom}</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Layers className="h-6 w-6 mx-auto mb-2 text-violet-600" />
              <p className="text-xs text-slate-600 mb-1">Số tầng</p>
              <p className="text-lg font-semibold text-slate-800">{result.storyNumber}</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Move className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-xs text-slate-600 mb-1">Mặt tiền</p>
              <p className="text-lg font-semibold text-slate-800">{result.facadeWidth}m</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Car className="h-6 w-6 mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-600 mb-1">Lề đường</p>
              <p className="text-lg font-semibold text-slate-800">{result.laneWidth}m</p>
            </div>
            <div className="professional-card p-4 text-center hover:shadow-md transition-all">
              <Shield className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-xs text-slate-600 mb-1">Pháp lý</p>
              <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                {result.legal === 'pink_book' ? 'Sổ hồng' : result.legal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bản đồ tiện ích xung quanh - Phần cuối */}
      {result.geoLocation && result.geoLocation.length === 2 && (
        <UtilitiesInteractiveMap 
          latitude={result.geoLocation[1]} 
          longitude={result.geoLocation[0]}
          distance={5}
          size={5}
          utilities={data.utilities}
        />
      )}

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-between items-center text-sm text-gray-600">
            <span>Transaction ID: {result.transId}</span>
            <span>Ngày tạo: {new Date(result.createdDate).toLocaleDateString('vi-VN')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}