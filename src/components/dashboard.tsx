'use client';

import { useState } from 'react';
import { PropertyInputForm } from '@/components/property-input-form';
import { ValuationDisplay } from '@/components/valuation-display';
import { ValuationResultDisplay } from '@/components/valuation-result-display';
import { MarketComparisonChart } from '@/components/market-comparison-chart';
import { PriceTrendChart } from '@/components/price-trend-chart';
import { DetailedInfoGrid } from '@/components/detailed-info-grid';
import { MapView } from '@/components/map-view';
import { ComparableSales } from '@/components/comparable-sales';
import { InteractiveMapSimple } from '@/components/interactive-map-simple';
import { RightPanelValuation } from '@/components/right-panel-valuation';
import { RightPanelRadarChart } from '@/components/right-panel-radar-chart';
import { UtilitiesInteractiveMap } from '@/components/utilities-interactive-map';
import { Header } from '@/components/ui/header';
import type { CombinedResult } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Home, TrendingUp, CheckCircle, Info } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
}

export default function Dashboard() {
  const [result, setResult] = useState<CombinedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [showMap, setShowMap] = useState(true); // Show map by default

  const handleValuation = (data: CombinedResult | null) => {
    if (data) {
      setResult(data);
      setError(null);
      setShowMap(false); // Hide map when results are shown
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    // Clear previous results when new location is selected
    setResult(null);
    setError(null);
  };

  const handleNewSearch = () => {
    setResult(null);
    setError(null);
    setShowMap(true);
    setSelectedLocation(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header 
        onNewSearch={handleNewSearch}
        showNewSearchButton={!!(result || selectedLocation)}
      />

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            {/* Selected Location Display */}
            {selectedLocation && (
              <Card className="professional-card border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-800">Vị trí đã chọn</h3>
                      </div>
                      {selectedLocation.address && (
                        <p className="text-sm text-slate-700 mb-3 font-medium">{selectedLocation.address}</p>
                      )}
                      <div className="flex gap-2 flex-wrap mb-3">
                        {selectedLocation.city && <Badge variant="secondary" className="bg-blue-100 text-blue-800">{selectedLocation.city}</Badge>}
                        {selectedLocation.district && <Badge variant="secondary" className="bg-blue-100 text-blue-800">{selectedLocation.district}</Badge>}
                        {selectedLocation.ward && <Badge variant="secondary" className="bg-blue-100 text-blue-800">{selectedLocation.ward}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">
                        Tọa độ: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <PropertyInputForm
              setResult={handleValuation}
              setIsLoading={setIsLoading}
              setError={setError}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
            />

            {isLoading && <LoadingState />}
            {error && (
              <Card className="professional-card border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                      <Info className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-8">
                {/* Check if we have API result format or old format */}
                {'valuation_result' in result ? (
                  <ValuationResultDisplay data={result} />
                ) : (
                  <>
                    <ValuationDisplay valuation={result.valuation} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <MarketComparisonChart
                        yourValue={result.valuation.reasonableValue}
                      />
                      <PriceTrendChart />
                    </div>
                    <DetailedInfoGrid
                      summary={result.summary}
                      details={result.summaryDetails}
                    />
                    
                    {/* Thêm utilities map cho format cũ */}
                    {(() => {
                      let lat, lng;
                      const anyResult = result as any;
                      
                      // Tìm coordinates từ result hoặc selectedLocation
                      if (anyResult.valuation_payload?.geoLocation && anyResult.valuation_payload.geoLocation.length === 2) {
                        lng = anyResult.valuation_payload.geoLocation[0];
                        lat = anyResult.valuation_payload.geoLocation[1];
                      } else if (selectedLocation) {
                        lat = selectedLocation.latitude;
                        lng = selectedLocation.longitude;
                      } else {
                        // Fallback
                        lat = 21.0282993;
                        lng = 105.8539963;
                      }
                      
                      return (
                        <UtilitiesInteractiveMap 
                          latitude={lat} 
                          longitude={lng}
                          distance={5}
                          size={5}
                          utilities={anyResult.utilities}
                        />
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </section>

          <aside className="lg:col-span-1 space-y-8">
            {showMap && !result ? (
              <>
                {/* Interactive Map for Location Selection */}
                <InteractiveMapSimple
                  onLocationSelect={handleLocationSelect}
                  showValuationButton={false}
                  initialLocation={{ lat: 21.0282993, lng: 105.8539963 }}
                  selectedLocation={selectedLocation}
                />
                
                {/* Getting Started Guide */}
                <Card className="professional-card bg-gradient-to-br from-slate-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-slate-800">Hướng dẫn sử dụng</h3>
                        <p className="text-sm text-slate-600 font-normal">Các bước thực hiện</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg text-blue-700 font-semibold text-sm">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">Chọn vị trí trên bản đồ</p>
                          <p className="text-xs text-slate-600 mt-1">Hoặc tìm kiếm địa chỉ cụ thể</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg text-blue-700 font-semibold text-sm">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">Nhập thông tin bất động sản</p>
                          <p className="text-xs text-slate-600 mt-1">Diện tích, loại hình, năm xây dựng</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg text-emerald-700 font-semibold text-sm">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">Nhận kết quả định giá AI</p>
                          <p className="text-xs text-slate-600 mt-1">Phân tích chi tiết và gợi ý giá bán</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : result ? (
              <>
                {/* Right Panel - Professional Valuation Results */}
                <div className="lg:sticky lg:top-20 space-y-6">
                  {/* Định giá bất động sản */}
                  <RightPanelValuation result={result} />
                  
                  {/* Chấm điểm đa tiêu chí */}
                  <RightPanelRadarChart result={result} />
                  
                  {/* Bất động sản tương đương */}
                  <ComparableSales result={result} />
                </div>
              </>
            ) : (
              !isLoading && (
                <div className="space-y-8">
                  <Card className="professional-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-sm">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-slate-800">Sẵn sàng bắt đầu</h3>
                          <p className="text-sm text-slate-600 font-normal">Định giá chuyên nghiệp</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">
                        Nhập thông tin chi tiết về bất động sản của bạn để nhận phân tích 
                        và định giá chính xác từ hệ thống AI tiên tiến.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

const LoadingState = () => (
  <div className="space-y-6">
    <Card className="professional-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg animate-pulse">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-32" />
      </CardContent>
    </Card>
  </div>
);
