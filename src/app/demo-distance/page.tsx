'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Navigation } from 'lucide-react';

interface DistanceResult {
  distances: {
    toCityCenter: { distance: number; name: string } | null;
    toDistrictCenter: { distance: number; name: string } | null;
  };
  analysis: {
    accessibility: 'excellent' | 'good' | 'fair' | 'poor';
    locationAdvantage: string;
    marketImpact: string;
  };
}

export default function DistanceAnalysisDemo() {
  const [latitude, setLatitude] = useState('21.027365');
  const [longitude, setLongitude] = useState('105.849486');
  const [address, setAddress] = useState('Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!latitude || !longitude) {
      setError('Vui lòng nhập tọa độ');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/complete-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          property_details: {
            type: 'town_house',
            landArea: 60,
            houseArea: 55,
          },
          auth_token: 'demo_token' // Demo purposes
        }),
      });

      const data = await response.json();
      
      if (data.success && data.distance_analysis) {
        setResult(data.distance_analysis);
      } else {
        setError(data.error || 'Lỗi không xác định');
      }
    } catch (err) {
      setError(`Lỗi kết nối: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessibilityColor = (accessibility: string) => {
    switch (accessibility) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const presetLocations = [
    {
      name: 'Hoàn Kiếm, Hà Nội',
      lat: '21.027365',
      lng: '105.849486',
      address: 'Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội'
    },
    {
      name: 'Quận 1, TP.HCM',
      lat: '10.7773145',
      lng: '106.6999907',
      address: 'Phường Bến Nghé, Quận 1, Hồ Chí Minh'
    },
    {
      name: 'Đống Đa, Hà Nội',
      lat: '21.0136436',
      lng: '105.8225234',
      address: 'Phường Láng Thượng, Quận Đống Đa, Hà Nội'
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Demo Tính Khoảng Cách Trung Tâm</h1>
        <p className="text-gray-600">
          Nhập tọa độ và địa chỉ để tính khoảng cách đến trung tâm thành phố và quận
        </p>
      </div>

      {/* Preset Locations */}
      <Card>
        <CardHeader>
          <CardTitle>📍 Vị trí mẫu</CardTitle>
          <CardDescription>Chọn một vị trí để test nhanh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {presetLocations.map((location, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3"
                onClick={() => {
                  setLatitude(location.lat);
                  setLongitude(location.lng);
                  setAddress(location.address);
                }}
              >
                <div>
                  <div className="font-medium">{location.name}</div>
                  <div className="text-xs text-gray-500">
                    {location.lat}, {location.lng}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>🏠 Thông tin bất động sản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Vĩ độ (Latitude)</Label>
              <Input
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="21.027365"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Kinh độ (Longitude)</Label>
              <Input
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="105.849486"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội"
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Đang phân tích...' : 'Phân tích khoảng cách'}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">❌ Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Distance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                📏 Kết quả phân tích khoảng cách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.distances.toCityCenter && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">🏛️ Đến trung tâm thành phố</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {result.distances.toCityCenter.distance} km
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.distances.toCityCenter.name}
                    </div>
                  </div>
                )}

                {result.distances.toDistrictCenter && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">🏢 Đến trung tâm quận</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {result.distances.toDistrictCenter.distance} km
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.distances.toDistrictCenter.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Accessibility Rating */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-600 mb-2">🚗 Đánh giá khả năng tiếp cận</h3>
                <div className="flex items-center gap-2">
                  <Badge className={`${getAccessibilityColor(result.analysis.accessibility)} text-white`}>
                    {result.analysis.accessibility.toUpperCase()}
                  </Badge>
                  <span className="text-lg font-medium">
                    {result.analysis.accessibility === 'excellent' && 'Xuất sắc'}
                    {result.analysis.accessibility === 'good' && 'Tốt'}
                    {result.analysis.accessibility === 'fair' && 'Trung bình'}
                    {result.analysis.accessibility === 'poor' && 'Kém'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Phân tích chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-gray-600 mb-2">🏘️ Ưu thế vị trí</h3>
                <p className="text-sm">{result.analysis.locationAdvantage}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-600 mb-2">💰 Tác động thị trường</h3>
                <p className="text-sm">{result.analysis.marketImpact}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 