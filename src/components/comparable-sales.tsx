'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, LayoutPanelLeft, TrendingUp, MapPin, Sparkles, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CombinedResult, RealEstate } from '@/lib/types';

interface ComparableSalesProps {
  result?: CombinedResult;
}

interface TransformedProperty {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  beds: number;
  baths: number;
  image: string;
  district: string;
  status: { label: string; className: string };
  pricePerM2: number;
  type: string;
}

const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)} T ₫`;
    } else if (value >= 1000000) {
        return `${Math.round(value / 1000000)} Tr ₫`;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
};

const getStatusBadge = (pricePerM2: number) => {
  if (pricePerM2 >= 150000000) {
    return { label: 'Cao cấp', className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' };
  } else if (pricePerM2 >= 100000000) {
    return { label: 'Hot', className: 'bg-gradient-to-r from-red-500 to-red-600 text-white' };
  } else if (pricePerM2 >= 50000000) {
    return { label: 'Tốt', className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' };
  } else {
    return { label: 'Hợp lý', className: 'bg-gradient-to-r from-green-500 to-green-600 text-white' };
  }
};

const getDistrictName = (addressDetail: string) => {
  const parts = addressDetail.split(' - ');
  if (parts.length >= 2) {
    return parts[1].replace('Quận ', '').replace('Huyện ', '').replace('Thành phố ', '');
  }
  return 'Không xác định';
};

const generateBedsBaths = (area: number) => {
  // Estimate beds and baths based on area
  if (area >= 120) return { beds: 3, baths: 3 };
  if (area >= 80) return { beds: 3, baths: 2 };
  if (area >= 50) return { beds: 2, baths: 2 };
  return { beds: 2, baths: 1 };
};

export function ComparableSales({ result }: ComparableSalesProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get real estates data from API result with proper null checking
  const realEstates = result && 'valuation_result' in result && result.valuation_result?.realEstates
    ? result.valuation_result.realEstates.slice(0, 3)
    : [];

  // Demo images for properties (to avoid hostname configuration issues)
  const demoImages = [
    'https://masteriwaterfrontoceanpark.com/wp-content/uploads/2023/08/phong-khach-can-ho-master-waterfront.jpg',
    'https://masterihomes.com.vn/wp-content/uploads/2021/05/can-ho-mau-masteri-centre-point-18.jpg',
    'https://masterisevietnam.com/wp-content/uploads/2021/06/phong-bep-1-ngu-masteri-west-heights.jpg'
  ];

  // Transform API data to component format
  const comparableProperties: TransformedProperty[] = realEstates.map((estate: RealEstate, index: number) => {
    const pricePerM2 = estate.area > 0 ? estate.totalPrice / estate.area : 0;
    const { beds, baths } = generateBedsBaths(estate.area);
    
    return {
      id: estate.id,
      title: estate.title,
      address: estate.address.detail || 'Địa chỉ không xác định',
      price: estate.totalPrice || estate.price * estate.area,
      area: estate.area,
      beds,
      baths,
      image: demoImages[index] || demoImages[0], // Use demo images instead of API images
      district: getDistrictName(estate.address.detail || ''),
      status: getStatusBadge(pricePerM2),
      pricePerM2,
      type: estate.type
    };
  });

  // Show placeholder message if no data
  if (!result || comparableProperties.length === 0) {
    return (
      <Card className="professional-card bg-gradient-to-br from-orange-50 via-white to-yellow-50 border-orange-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">BĐS tương đương</h3>
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-sm text-slate-600 font-normal">Thị trường gần đây</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center py-8">
          <Home className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Chưa có dữ liệu so sánh</p>
          <p className="text-sm text-slate-500 mt-1">Vui lòng thực hiện định giá để xem thông tin</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card bg-gradient-to-br from-orange-50 via-white to-yellow-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">BĐS tương đương</h3>
              <Sparkles className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-sm text-slate-600 font-normal">Thị trường gần đây</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {comparableProperties.map((prop: TransformedProperty) => (
          <article 
            key={prop.id} 
            className="group p-4 bg-white/80 rounded-xl border border-orange-100 hover:bg-white hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex gap-4">
              <div className="relative">
                <Image
                  src={prop.image}
                  alt={`Hình ảnh của ${prop.title}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover aspect-square shadow-sm"
                />
                <Badge className={`absolute -top-2 -right-2 text-xs ${prop.status.className}`}>
                  {prop.status.label}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-2">
                {/* Price and District */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-orange-700">
                    {isMounted ? formatCurrency(prop.price) : '...'}
                  </p>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <MapPin className="h-3 w-3 mr-1" />
                    {prop.district}
                  </Badge>
                </div>
                
                {/* Title */}
                <p className="text-sm font-medium text-slate-700 leading-tight line-clamp-2">
                  {prop.title}
                </p>
                
                {/* Address */}
                <p className="text-xs text-slate-500 leading-tight line-clamp-1">
                  {prop.address}
                </p>
                
                {/* Property Details */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                    <BedDouble className="h-3 w-3" /> {prop.beds}
                  </Badge>
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
                    <Bath className="h-3 w-3" /> {prop.baths}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                    <LayoutPanelLeft className="h-3 w-3" /> {prop.area} m²
                  </Badge>
                </div>
                
                {/* Price per m2 */}
                <div className="pt-2 border-t border-orange-100">
                  <p className="text-xs text-slate-500">
                    Giá/m²: <span className="font-semibold text-orange-600">{isMounted ? formatCurrency(prop.pricePerM2) : '...'}</span>
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
        
        {/* Summary Section */}
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 mb-2">Giá trung bình thị trường</p>
            <p className="text-xl font-bold text-orange-700">
              {isMounted && comparableProperties.length > 0 ? formatCurrency(
                comparableProperties.reduce((sum: number, prop: TransformedProperty) => sum + prop.pricePerM2, 0) / comparableProperties.length
              ) : '...'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Giá/m² từ {comparableProperties.length} BDS tương đương
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

