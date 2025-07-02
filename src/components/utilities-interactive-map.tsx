'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle } from 'lucide-react';
import { Utility, UtilityType } from '@/lib/types';

// Dynamic import React-Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface UtilitiesInteractiveMapProps {
  latitude: number;
  longitude: number;
  distance?: number;
  size?: number;
  utilities?: {
    total: number;
    data: Utility[];
    groupedData: Record<UtilityType, Utility[]>;
  };
}

interface GroupedUtilities {
  [key: string]: Utility[];
}

const utilityIcons: Record<UtilityType, string> = {
  hospital: '🏥',
  market: '🏪',
  restaurant: '🍽️',
  cafe: '☕',
  supermarket: '🛒',
  commercial_center: '🏬'
};

const utilityColors: Record<UtilityType, string> = {
  hospital: '#ef4444',
  market: '#10b981',
  restaurant: '#f59e0b',
  cafe: '#8b5cf6',
  supermarket: '#3b82f6',
  commercial_center: '#ec4899'
};

const utilityLabels: Record<UtilityType, string> = {
  hospital: 'Bệnh viện',
  market: 'Chợ',
  restaurant: 'Nhà hàng',
  cafe: 'Quán cà phê',
  supermarket: 'Siêu thị',
  commercial_center: 'Trung tâm thương mại'
};

export function UtilitiesInteractiveMap({ 
  latitude, 
  longitude, 
  distance = 10, 
  size = 5,
  utilities: utilitiesFromProps
}: UtilitiesInteractiveMapProps) {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [groupedUtilities, setGroupedUtilities] = useState<GroupedUtilities>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<any>(null);

  // Load utilities data
  useEffect(() => {
    const loadUtilities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('UtilitiesInteractiveMap received props:', {
          latitude,
          longitude,
          utilitiesFromProps: utilitiesFromProps ? 'YES' : 'NO',
          utilitiesDataLength: utilitiesFromProps?.data?.length
        });

        // Nếu có utilities data từ props, sử dụng luôn
        if (utilitiesFromProps) {
          setUtilities(utilitiesFromProps.data || []);
          setGroupedUtilities(utilitiesFromProps.groupedData || {});
          setIsLoading(false);
          console.log('Using utilities from props:', utilitiesFromProps.data?.length, 'items');
          return;
        }

        // Nếu không có, gọi API như cũ
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
          distance: distance.toString(),
          size: size.toString(),
        });

        console.log('Calling utilities API with params:', params.toString());
        const response = await fetch(`/api/utilities?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.warn('Utilities API failed, continuing with empty data:', errorData.error);
          // Không throw error, chỉ hiển thị map trống
          setUtilities([]);
          setGroupedUtilities({});
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Utilities API response:', data);
        setUtilities(data.data || []);
        setGroupedUtilities(data.groupedData || {});
      } catch (err) {
        console.error('Error loading utilities:', err);
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      loadUtilities();
    }
  }, [latitude, longitude, distance, size, utilitiesFromProps]);

  // Create custom icons and load CSS
  useEffect(() => {
    const createIcons = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Add CSS for Leaflet if not already added
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const L = (await import('leaflet')).default;

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create center marker icon
        const centerIcon = L.divIcon({
          html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          className: 'custom-div-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        setCustomIcon(centerIcon);
      } catch (error) {
        console.error('Error creating icons:', error);
      }
    };

    createIcons();
  }, []);

  const createUtilityIcon = (type: UtilityType) => {
    if (typeof window === 'undefined') return null;

    const L = require('leaflet');
    
    return L.divIcon({
      html: `<div style="background: ${utilityColors[type]}; color: white; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">${utilityIcons[type]}</div>`,
      className: 'custom-utility-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Bản đồ tiện ích xung quanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Bản đồ tiện ích xung quanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Bản đồ tiện ích xung quanh
          <Badge variant="secondary" className="ml-auto">
            {utilities.length} địa điểm
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map using React-Leaflet */}
        <div className="h-80 rounded-lg border overflow-hidden bg-gray-100">
          <div className="h-full w-full">
            {typeof window !== 'undefined' && (
              <MapContainer
                center={[latitude, longitude]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Center marker (property location) */}
                {customIcon && (
                  <Marker position={[latitude, longitude]} icon={customIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>Vị trí bất động sản</strong>
                        <br />
                        <small>{latitude.toFixed(6)}, {longitude.toFixed(6)}</small>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Utility markers */}
                {utilities.map((utility, index) => {
                  const [lng, lat] = utility.geoLocation;
                  const type = utility.type as UtilityType;
                  const icon = createUtilityIcon(type);
                  
                  if (!icon) return null;
                  
                  return (
                    <Marker key={index} position={[lat, lng]} icon={icon}>
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{utilityIcons[type]}</span>
                            <strong style={{ color: utilityColors[type] }}>{utilityLabels[type]}</strong>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>{utility.name}</strong>
                          </div>
                          <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                            {utility.address}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '12px' }}>
                            <span>📍</span>
                            <span>Cách {formatDistance(utility.distance)}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(groupedUtilities).map(([type, items]) => {
            if (!items || items.length === 0) return null;
            
            const utilityType = type as UtilityType;
            
            return (
              <div 
                key={type} 
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: utilityColors[utilityType] }}
                >
                  {utilityIcons[utilityType]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {utilityLabels[utilityType]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {items.length} địa điểm
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-gray-500">
          Nhấp vào các biểu tượng trên bản đồ để xem thông tin chi tiết
        </div>
      </CardContent>
    </Card>
  );
} 