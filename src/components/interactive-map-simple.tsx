'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation, Search, X, Map, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { getGeoapifyApiKey } from '@/lib/config';

// Dynamic import của Leaflet components để tránh SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
}

interface InteractiveMapProps {
  onLocationSelect?: (location: LocationData) => void;
  initialLocation?: { lat: number; lng: number };
  authToken?: string;
  showValuationButton?: boolean;
  selectedLocation?: LocationData | null;
}

interface SearchSuggestion {
  formatted: string;
  lat: number;
  lon: number;
  place_id: string;
  address_line1?: string;
  address_line2?: string;
  category?: string;
}

// Component xử lý click event trên Leaflet map
const MapClickHandler = dynamic(() => 
  Promise.resolve().then(() => {
    const { useMapEvents } = require('react-leaflet');
    
    return function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
      useMapEvents({
        click: (event: any) => {
          const { lat, lng } = event.latlng;
          onMapClick(lat, lng);
        },
      });
      return null;
    };
  }),
  { ssr: false }
);

// Component để handle map events và set reference
const MapEvents = dynamic(() => 
  Promise.resolve().then(() => {
    const { useMap } = require('react-leaflet');
    
    return function MapEventsComponent({ onMapReady }: { onMapReady: (map: any) => void }) {
      const map = useMap();
      
      useEffect(() => {
        if (map) {
          onMapReady(map);
        }
      }, [map, onMapReady]);
      
      return null;
    };
  }),
  { ssr: false }
);

export function InteractiveMapSimple({ 
  onLocationSelect, 
  initialLocation = { lat: 21.0282993, lng: 105.8539963 }, // Hanoi center
  authToken,
  showValuationButton = true,
  selectedLocation
}: InteractiveMapProps) {
  const [selectedLocationState, setSelectedLocation] = useState<LocationData | null>(selectedLocation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Debounce search input để tránh gọi API quá nhiều
  const debouncedSearchAddress = useDebounce(searchAddress, 1000);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLocation.lat, initialLocation.lng]);
  const [mapZoom, setMapZoom] = useState(15);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // State để hiển thị trạng thái debounce
  const isDebouncing = searchAddress !== debouncedSearchAddress && searchAddress.length > 1;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Leaflet icon fix for Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle when map is ready
  const handleMapReady = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  // Function to smoothly zoom and center to a location
  const zoomToLocation = useCallback((lat: number, lng: number, zoom = 16) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    
    // If map instance is available, use flyTo for smooth animation
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo([lat, lng], zoom, {
        duration: 1.5, // Animation duration in seconds
        easeLinearity: 0.25
      });
    }
  }, []);

  // Sync with external selectedLocation prop từ Dashboard
  useEffect(() => {
    if (selectedLocation && selectedLocation !== selectedLocationState) {
      setSelectedLocation(selectedLocation);
      // Update map center và marker position
      const lat = selectedLocation.latitude;
      const lng = selectedLocation.longitude;
      zoomToLocation(lat, lng, 16);
      setMarkerPosition([lat, lng]);
      
      // Update search address nếu có
      if (selectedLocation.address) {
        setSearchAddress(selectedLocation.address);
      }
    }
  }, [selectedLocation, selectedLocationState, zoomToLocation]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      // Update map center và marker cho interactive map với zoom animation
      zoomToLocation(lat, lng, 16);
      setMarkerPosition([lat, lng]);
      
      // Get location info from coordinates
      const response = await fetch(`/api/location?latitude=${lat}&longitude=${lng}`);
      const data = await response.json();
      
      if (data.success) {
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: data.parsed_address.formatted_address,
          city: data.parsed_address.city,
          district: data.parsed_address.district,
          ward: data.parsed_address.ward,
        };
        
        setSelectedLocation(locationData);
        
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
        
        toast({
          title: "Đã chọn vị trí",
          description: `${data.parsed_address.formatted_address}`,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lấy thông tin địa chỉ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      // Using Geoapify Autocomplete API with Vietnam bias
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&lang=vi&limit=8&bias=countrycode:vn&apiKey=${getGeoapifyApiKey()}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const suggestionsList: SearchSuggestion[] = data.features.map((feature: any) => ({
          formatted: feature.properties.formatted || feature.properties.address_line1 || '',
          lat: feature.properties.lat,
          lon: feature.properties.lon,
          place_id: feature.properties.place_id || Math.random().toString(),
          address_line1: feature.properties.address_line1,
          address_line2: feature.properties.address_line2,
          category: feature.properties.category,
        }));
        
        setSuggestions(suggestionsList);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Effect để tự động fetch suggestions khi debouncedSearchAddress thay đổi
  useEffect(() => {
    if (debouncedSearchAddress && debouncedSearchAddress.trim().length > 1) {
      fetchSuggestions(debouncedSearchAddress);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearchAddress, fetchSuggestions]);

  const handleSearchInputChange = (value: string) => {
    setSearchAddress(value);
    // Suggestions sẽ được fetch tự động thông qua useEffect với debouncedSearchAddress
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchAddress(suggestion.formatted);
    setShowSuggestions(false);
    handleLocationSelect(suggestion.lat, suggestion.lon);
  };

  const clearSearch = () => {
    setSearchAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Lỗi",
        description: "Trình duyệt không hỗ trợ định vị",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    
    toast({
      title: "Đang lấy vị trí",
      description: "Vui lòng cho phép truy cập vị trí...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude } = position.coords;
        
        toast({
          title: "Thành công",
          description: `Đã lấy vị trí hiện tại: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
        
        handleLocationSelect(latitude, longitude);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Không thể lấy vị trí hiện tại";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Người dùng từ chối cấp quyền truy cập vị trí";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Thông tin vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            errorMessage = "Hết thời gian chờ lấy vị trí";
            break;
        }
        
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!searchAddress.trim()) return;
    
    setIsLoading(true);
    try {
      // Using Geoapify Geocoding API
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchAddress)}&apiKey=${getGeoapifyApiKey()}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const { lat, lon } = feature.properties;
        
        const locationData: LocationData = {
          latitude: lat,
          longitude: lon,
          address: feature.properties.formatted || searchAddress,
        };
        
        setSelectedLocation(locationData);
        zoomToLocation(lat, lon, 16);
        setMarkerPosition([lat, lon]);
        
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
        
        toast({
          title: "Tìm thấy địa chỉ",
          description: feature.properties.formatted || searchAddress,
        });
      } else {
        toast({
          title: "Không tìm thấy",
          description: "Không thể tìm thấy địa chỉ này",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tìm kiếm địa chỉ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValuation = async () => {
    if (!selectedLocationState || !authToken) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn vị trí và cung cấp auth token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/complete-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocationState.latitude,
          longitude: selectedLocationState.longitude,
          property_details: {
            type: 'town_house',
            landArea: 60.0,
            houseArea: 55.0,
            bedRoom: 3,
            bathRoom: 2,
            legal: 'pink_book',
          },
          auth_token: authToken,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Định giá thành công",
          description: "Kiểm tra kết quả bên dưới",
        });
        console.log('Valuation result:', data);
      } else {
        toast({
          title: "Lỗi định giá",
          description: data.error || "Không thể thực hiện định giá",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteractiveMapClick = (lat: number, lng: number) => {
    toast({
      title: "Đã click trên bản đồ",
      description: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
    handleLocationSelect(lat, lng);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Map Selector - Chọn vị trí định giá
        </CardTitle>
        <CardDescription>
          Click trực tiếp trên bản đồ Leaflet hoặc tìm kiếm địa chỉ để chọn vị trí định giá bất động sản
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Location Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Label htmlFor="search">Tìm kiếm địa chỉ</Label>
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Input
                    ref={searchInputRef}
                    id="search"
                    placeholder="Nhập địa chỉ (VD: Hoàn Kiếm, Hà Nội)..."
                    value={searchAddress}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                    onFocus={() => {
                      // Chỉ hiển thị suggestions nếu đã có và search input đủ dài
                      if (searchAddress.length > 1 && suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {isDebouncing && (
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-blue-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {searchAddress && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {isLoadingSuggestions ? (
                        <div className="p-3 text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                          <span className="text-sm">Đang tìm kiếm...</span>
                        </div>
                      ) : suggestions.length > 0 ? (
                        <div className="py-1">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={suggestion.place_id || index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {suggestion.address_line1 || suggestion.formatted}
                                  </p>
                                  {suggestion.address_line2 && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {suggestion.address_line2}
                                    </p>
                                  )}
                                  {suggestion.category && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {suggestion.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          <span className="text-sm">Không tìm thấy kết quả</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleSearchLocation} 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleGetCurrentLocation} 
                variant="outline" 
                size="sm"
                disabled={isLoading || isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lấy vị trí...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Vị trí hiện tại
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocationState && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Vị trí đã chọn
            </h4>
            <div className="space-y-1 text-sm">
              {selectedLocationState.address && (
                <p><strong>Địa chỉ:</strong> {selectedLocationState.address}</p>
              )}
              <p><strong>Tọa độ:</strong> {selectedLocationState.latitude.toFixed(6)}, {selectedLocationState.longitude.toFixed(6)}</p>
              {selectedLocationState.city && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedLocationState.city}</Badge>
                  {selectedLocationState.district && <Badge variant="secondary">{selectedLocationState.district}</Badge>}
                  {selectedLocationState.ward && <Badge variant="secondary">{selectedLocationState.ward}</Badge>}
                </div>
              )}
            </div>
            {showValuationButton && authToken && (
              <Button 
                onClick={handleValuation} 
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang định giá...
                  </>
                ) : (
                  'Định giá tại vị trí này'
                )}
              </Button>
            )}
          </div>
        )}

        {/* Interactive Map Display */}
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <div className="w-full h-full">
            {isMounted && (
              <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Map events and click handler */}
                <MapEvents onMapReady={handleMapReady} />
                <MapClickHandler onMapClick={handleInteractiveMapClick} />
                
                {/* Marker hiển thị vị trí đã chọn */}
                {markerPosition && (
                  <Marker position={markerPosition}>
                    <Popup>
                      {selectedLocationState ? (
                        <div className="p-2">
                          <p className="font-medium">Vị trí đã chọn</p>
                          {selectedLocationState.address && (
                            <p className="text-sm text-gray-600">{selectedLocationState.address}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {selectedLocationState.latitude.toFixed(6)}, {selectedLocationState.longitude.toFixed(6)}
                          </p>
                        </div>
                      ) : (
                        <p>Vị trí đã chọn</p>
                      )}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            )}
            {!isMounted && (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          💡 <strong>Hướng dẫn:</strong> 
          Click trực tiếp trên bản đồ hoặc gõ địa chỉ và chọn từ gợi ý. Tìm kiếm có độ trễ 500ms để tối ưu hiệu suất. Bản đồ sẽ tự động zoom vào vị trí đã chọn.
        </div>

        {/* Quick Location Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchAddress('Hoàn Kiếm, Hà Nội');
              handleLocationSelect(21.0285, 105.8542);
            }}
            disabled={isLoading || isGettingLocation}
          >
            📍 Hoàn Kiếm, HN
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchAddress('Quận 1, TP.HCM');
              handleLocationSelect(10.7769, 106.7009);
            }}
            disabled={isLoading || isGettingLocation}
          >
            📍 Quận 1, HCM
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchAddress('Đà Nẵng');
              handleLocationSelect(16.0471, 108.2068);
            }}
            disabled={isLoading || isGettingLocation}
          >
            📍 Đà Nẵng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 