'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getGeoapifyApiKey } from '@/lib/config';

// Interface for planning data
interface PlanningData {
  success: boolean;
  data?: {
    status: number;
    points: Array<{ lat: number; lng: number }>;
    address: string;
    id: number;
    province_id: string;
    district_id: string;
    ward_id: string;
    html: string;
  };
  message?: string;
  status_code?: number;
  geocodingData?: {
    success: boolean;
    data?: {
      status: number;
      data: string;
      need_update: boolean;
      province_id: string;
      district_id: string;
      ward_id: string;
      layer_2: string;
      name: string;
      road_id: string | null;
      max_native_zoom: number;
      url: string;
      district_new_alias: string | null;
      url_district: string;
      url_district_new: string;
      url_ward: string;
      url_road: string;
      url_map: string;
      html: string;
    };
    message?: string;
    status_code?: number;
  };
}

// Component for handling map clicks and events
function MapClickHandler({ 
  onMapClick, 
  onZoomChange,
  onMapReady
}: { 
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
  onMapReady?: (map: any) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend: (e) => {
      if (onZoomChange) {
        onZoomChange(e.target.getZoom());
      }
    },
  });

  // Pass map instance to parent
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

// Component for planning info popup on map
function PlanningPopup({ 
  position, 
  planningData, 
  onClose,
  isLoading
}: {
  position: [number, number] | null;
  planningData: PlanningData | null;
  onClose: () => void;
  isLoading: boolean;
}) {
  const markerRef = useRef<L.Marker>(null);

  if (!position) return null;

  // Debug logs
  console.log('PlanningPopup render:', {
    position,
    isLoading,
    hasData: !!planningData?.data,
    hasHtml: !!planningData?.data?.html,
    htmlLength: planningData?.data?.html?.length || 0
  });

  // Auto-open popup when marker is created
  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 100); // Small delay to ensure marker is rendered
    
    return () => clearTimeout(timer);
  }, [position]);

  // Custom icon for planning marker
  const planningIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <Marker ref={markerRef} position={position} icon={planningIcon}>
      <Popup 
        minWidth={280}
        maxWidth={320}
        maxHeight={400}
        closeButton={true}
        autoClose={false}
        closeOnEscapeKey={true}
        className="planning-popup"
        autoPan={true}
        keepInView={true}
      >
        <div className="planning-popup-content">
          {isLoading ? (
            <div className="flex items-center p-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-700 text-sm">Đang tải...</p>
            </div>
          ) : planningData?.data ? (
            <div className="max-h-80 overflow-y-auto">
              {/* Compact header */}
              <div className="bg-blue-600 text-white p-3 -mx-3 -mt-3 mb-3">
                <h3 className="font-bold text-sm">📋 Thông tin quy hoạch</h3>
                <p className="text-xs opacity-90 truncate">{planningData.data.address}</p>
              </div>

              {/* Compact content */}
              <div className="space-y-3 px-1">
                {/* Raw HTML content - nhỏ gọn */}
                {planningData.data.html && (
                  <div 
                    className="text-xs planning-raw-html overflow-auto max-h-48"
                    dangerouslySetInnerHTML={{ __html: planningData.data.html }}
                  />
                )}

                {/* Compact action buttons */}
                <div className="flex gap-1 pt-2 border-t">
                  <button 
                    onClick={() => window.open(`https://maps.google.com/?q=${position[0]},${position[1]}`, '_blank')}
                    className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    🗺️ Maps
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${position[0]}, ${position[1]}`);
                    }}
                    className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-gray-700 font-medium text-sm">Vị trí đã chọn</p>
              <p className="text-gray-600 text-xs">
                {position[0].toFixed(4)}, {position[1].toFixed(4)}
              </p>
              {!planningData && (
                <p className="text-gray-500 text-xs mt-1">Chưa có dữ liệu quy hoạch</p>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// Component for creating planning information overlays
function PlanningOverlayManager({ 
  map, 
  showOverlay, 
  planningData,
  overlaysRef,
  onAreaClick
}: {
  map: any;
  showOverlay: boolean;
  planningData: PlanningData | null;
  overlaysRef: React.RefObject<L.DivOverlay[]>;
  onAreaClick: (area: any) => void;
}) {
  const [planningAreas, setPlanningAreas] = useState<Array<{
    lat: number;
    lng: number;
    info: string;
    type: string;
    color: string;
    detailInfo: {
      id: string;
      area: string;
      address: string;
      landType: string;
      planningType: string;
      restrictions: string[];
      buildingRatio: string;
    };
  }>>([]);

  // Listen to map events to update overlays
  useEffect(() => {
    if (!map || !showOverlay) {
      // Clear existing overlays
      if (overlaysRef.current) {
        overlaysRef.current.forEach(overlay => {
          if (map) {
            map.removeLayer(overlay);
          }
        });
        overlaysRef.current.length = 0;
      }
      setPlanningAreas([]);
      return;
    }

    const updatePlanningAreas = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      // Only show overlays at higher zoom levels to avoid clutter
      if (zoom < 15) {
        setPlanningAreas([]);
        return;
      }

      // Create sample planning overlays (you can replace this with real API calls)
      const sampleAreas = [
        { 
          lat: 21.0285, lng: 105.8542, info: "Khu vực lịch sử - Văn hóa", type: "Văn hóa", color: "#FFD700",
          detailInfo: {
            id: "T7-34",
            area: "281.2m²",
            address: "Phường Cát Linh, Quận Đống Đa, Hà Nội",
            landType: "ODT",
            planningType: "Đất nhóm nhà ở liền có (đất ở dân cư)",
            restrictions: ["Dự liệu tham khảo", "Vui lòng cân cứ theo mẫu", "Ký hiệu đất trên từng loại bản đồ"],
            buildingRatio: "Kiểm tra lại với cơ quan chức năng"
          }
        },
        { 
          lat: 21.0337, lng: 105.7981, info: "Khu đô thị mới", type: "Đô thị", color: "#32CD32",
          detailInfo: {
            id: "T8-45",
            area: "450.5m²",
            address: "Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
            landType: "DTS",
            planningType: "Đất thương mại dịch vụ",
            restrictions: ["Tuân thủ quy hoạch đô thị", "Chiều cao tối đa 25 tầng"],
            buildingRatio: "Hệ số sử dụng đất: 4.0"
          }
        },
        { 
          lat: 20.9876, lng: 105.8125, info: "Khu dân cư", type: "Nhà ở", color: "#87CEEB",
          detailInfo: {
            id: "T5-22",
            area: "180.0m²",
            address: "Phường Nhân Chính, Quận Thanh Xuân, Hà Nội",
            landType: "ODT",
            planningType: "Đất ở đô thị",
            restrictions: ["Xây dựng tối đa 4 tầng", "Mật độ xây dựng 60%"],
            buildingRatio: "Hệ số sử dụng đất: 2.4"
          }
        },
        { 
          lat: 21.0245, lng: 105.8412, info: "Khu thương mại", type: "Thương mại", color: "#FF6347",
          detailInfo: {
            id: "T9-67",
            area: "520.8m²",
            address: "Phường Láng Thượng, Quận Đống Đa, Hà Nội",
            landType: "TMDT",
            planningType: "Đất thương mại dịch vụ",
            restrictions: ["Kinh doanh thương mại", "Dịch vụ công cộng"],
            buildingRatio: "Hệ số sử dụng đất: 3.5"
          }
        },
        { 
          lat: 21.0156, lng: 105.8372, info: "Công viên - Cây xanh", type: "Cây xanh", color: "#228B22",
          detailInfo: {
            id: "T3-12",
            area: "1200.0m²",
            address: "Phường Láng Hạ, Quận Đống Đa, Hà Nội",
            landType: "CXL",
            planningType: "Đất cây xanh lâu dài",
            restrictions: ["Không được xây dựng", "Bảo tồn cây xanh"],
            buildingRatio: "Không áp dụng"
          }
        },
        { 
          lat: 21.0195, lng: 105.8502, info: "Khu công nghiệp", type: "Công nghiệp", color: "#8B4513",
          detailInfo: {
            id: "T6-38",
            area: "800.0m²",
            address: "Phường Phương Liên, Quận Đống Đa, Hà Nội",
            landType: "SKX",
            planningType: "Đất sản xuất kinh doanh",
            restrictions: ["Công nghiệp không ô nhiễm", "Tuân thủ PCCC"],
            buildingRatio: "Hệ số sử dụng đất: 3.0"
          }
        }
      ];

      // Filter areas within current bounds
      const visibleAreas = sampleAreas.filter(area => 
        bounds.contains([area.lat, area.lng])
      );

      setPlanningAreas(visibleAreas);
    };

    // Initial update
    updatePlanningAreas();

    // Listen to map events
    const events = ['zoomend', 'moveend'];
    events.forEach(event => {
      map.on(event, updatePlanningAreas);
    });

    return () => {
      events.forEach(event => {
        map.off(event, updatePlanningAreas);
      });
    };
  }, [map, showOverlay, overlaysRef]);

  // Create overlays
  useEffect(() => {
    if (!map || !showOverlay || planningAreas.length === 0) return;

    // Clear existing overlays
    if (overlaysRef.current) {
      overlaysRef.current.forEach(overlay => {
        map.removeLayer(overlay);
      });
    }

    const newOverlays: L.DivOverlay[] = [];

    planningAreas.forEach((area, index) => {
      // Create div element for overlay
      const overlayElement = L.DomUtil.create('div', 'planning-overlay');
      overlayElement.innerHTML = `
        <div style="
          background: ${area.color}; 
          color: white; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 11px; 
          font-weight: bold;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
          white-space: nowrap;
          border: 1px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <div style="font-size: 10px; opacity: 0.9;">${area.type}</div>
          <div>${area.info}</div>
        </div>
      `;

      // Add click handler to overlay element
      overlayElement.addEventListener('click', (e) => {
        e.stopPropagation();
        onAreaClick(area);
      });

      // Create Leaflet DivOverlay (using Tooltip for simplicity)
      const overlay = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'planning-text-overlay',
        opacity: 0.9
      })
        .setContent(overlayElement)
        .setLatLng([area.lat, area.lng]);

      map.addLayer(overlay);
      newOverlays.push(overlay);
    });

    if (overlaysRef.current) {
      overlaysRef.current.splice(0, overlaysRef.current.length, ...newOverlays);
    }

    return () => {
      newOverlays.forEach(overlay => {
        map.removeLayer(overlay);
      });
    };
  }, [map, showOverlay, planningAreas, overlaysRef]);

  return null;
}

// Component for compact planning info display
function PlanningInfoCompact({ 
  planningData, 
  selectedLocation,
  onLayerSwitch
}: {
  planningData: PlanningData;
  selectedLocation: [number, number] | null;
  onLayerSwitch?: (layerType: string, url: string, name: string) => void;
}) {
  const [parsedInfo, setParsedInfo] = useState<{
    title: string;
    address: string;
    planningInfo: Array<{ area: string; type: string; details: string; color: string }>;
    coordinates: { lat: number; lng: number } | null;
    itemId: string;
    landType: { id: string; area: string; description: string } | null;
  } | null>(null);

  useEffect(() => {
    if (planningData?.data?.html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(planningData.data.html, 'text/html');
        
        // Extract title
        const titleElement = doc.querySelector('.sqh-pin-inf__tle');
        const title = titleElement?.textContent?.trim() || '';
        
        // Extract address
        const addressElement = doc.querySelector('.sqh-pin-inf__adr');
        const address = addressElement?.textContent?.trim() || planningData?.data?.address || '';
        
        // Extract coordinates
        const latInput = doc.querySelector('input[name="lat"]') as HTMLInputElement;
        const lngInput = doc.querySelector('input[name="lng"]') as HTMLInputElement;
        const itemIdInput = doc.querySelector('input[name="item_id"]') as HTMLInputElement;
        
        const coordinates = latInput && lngInput ? {
          lat: parseFloat(latInput.value),
          lng: parseFloat(lngInput.value)
        } : null;
        const itemId = itemIdInput?.value || planningData?.data?.id?.toString() || '';
        
        // Extract land type info
        const typeInfoElement = doc.querySelector('.type-info');
        let landType = null;
        if (typeInfoElement) {
          const typeId = typeInfoElement.querySelector('.type-info__id')?.textContent?.trim() || '';
          const typeArea = typeInfoElement.querySelector('.type-info__sqr')?.textContent?.trim() || '';
          const typeDescription = typeInfoElement.querySelector('.type-info__txt')?.textContent?.trim() || '';
          landType = { id: typeId, area: typeArea, description: typeDescription };
        }
        
        // Extract planning info
        let planningInfo: Array<{ area: string; type: string; details: string; color: string }> = [];
        const textCols = Array.from(doc.querySelectorAll('.text-col'));
        if (textCols.length > 0) {
          planningInfo = textCols.map(col => {
            const areaElement = col.querySelector('.text-col__lbl');
            const area = areaElement?.textContent?.trim() || '';
            
            const typeElement = col.querySelector('.text-col__txt div[style*="background-color"]');
            const type = typeElement?.textContent?.trim() || '';
            
            const styleAttr = typeElement?.getAttribute('style') || '';
            const colorMatch = styleAttr.match(/background-color:\s*([^;]+)/);
            const color = colorMatch ? colorMatch[1].trim() : '#gray';
            
            const detailsElement = col.querySelector('.text-col__txt div:last-child');
            const details = detailsElement?.textContent?.trim() || '';
            
            return { area, type, details, color };
          }).filter(item => item.area && item.type);
        }

        setParsedInfo({ title, address, planningInfo, coordinates, itemId, landType });
      } catch (error) {
        console.error('Error parsing HTML content:', error);
        setParsedInfo(null);
      }
    }
  }, [planningData]);

  // Handle click events on geocoding control buttons
  useEffect(() => {
    if (!planningData?.geocodingData?.data?.html || !onLayerSwitch) return;

    const handleControlClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.btn--map-switch') as HTMLElement;
      
      if (button) {
        event.preventDefault();
        event.stopPropagation();
        
        const layerType = button.getAttribute('data-type') || '';
        const url = button.getAttribute('data-url') || '';
        const name = button.getAttribute('data-name') || button.textContent || '';
        
        if (url && layerType) {
          onLayerSwitch(layerType, url, name);
          
          // Update active states
          const allButtons = document.querySelectorAll('.geocoding-controls .btn--map-switch');
          allButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
        }
      }
    };

    // Add click listeners to all map switch buttons
    const controlsContainer = document.querySelector('.geocoding-controls');
    if (controlsContainer) {
      controlsContainer.addEventListener('click', handleControlClick);
      
      return () => {
        controlsContainer.removeEventListener('click', handleControlClick);
      };
    }
  }, [planningData?.geocodingData?.data?.html, onLayerSwitch]);

  if (!parsedInfo && !planningData?.data) {
    return <div className="text-gray-500 text-sm">Không có dữ liệu</div>;
  }

  return (
    <div className="space-y-3">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">
            {parsedInfo?.title || `Thửa đất ID: ${planningData?.data?.id}`}
          </h4>
          <p className="text-xs text-gray-600 truncate">
            {parsedInfo?.address || planningData?.data?.address}
          </p>
        </div>
      </div>

      {/* Land type and coordinates */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
          <div className="font-medium text-blue-800">Loại đất</div>
          <div className="text-blue-700">
            {parsedInfo?.landType?.id || 'N/A'}
          </div>
          <div className="text-blue-600 text-[10px]">
            {parsedInfo?.landType?.area || 'Chưa xác định'}
          </div>
        </div>
        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
          <div className="font-medium text-green-800">Tọa độ</div>
          <div className="text-green-700 font-mono text-[10px]">
            {selectedLocation ? `${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Planning info */}
      {parsedInfo?.planningInfo && parsedInfo.planningInfo.length > 0 && (
        <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
          <div className="font-medium text-yellow-800 text-xs mb-2">Quy hoạch xây dựng</div>
          <div className="space-y-1">
            {parsedInfo.planningInfo.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{item.type}</div>
                  <div className="text-[10px] text-gray-600">{item.area}</div>
                </div>
              </div>
            ))}
            {parsedInfo.planningInfo.length > 2 && (
              <div className="text-[10px] text-gray-500">
                +{parsedInfo.planningInfo.length - 2} loại khác
              </div>
            )}
          </div>
        </div>
      )}

      {/* Land type description */}
      {parsedInfo?.landType?.description && (
        <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
          <div className="font-medium text-purple-800 text-xs">Mô tả</div>
          <div className="text-purple-700 text-xs">{parsedInfo.landType.description}</div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <button 
          onClick={() => selectedLocation && window.open(`https://maps.google.com/?q=${selectedLocation[0]},${selectedLocation[1]}`, '_blank')}
          className="px-2 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
        >
          🗺️ Maps
        </button>
        <button 
          onClick={() => {
            if (selectedLocation) {
              navigator.clipboard.writeText(`${selectedLocation[0]}, ${selectedLocation[1]}`);
              alert('Đã copy tọa độ!');
            }
          }}
          className="px-2 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
        >
          📋 Copy
        </button>
        <button 
          onClick={() => {
            const info = `
Thửa đất: ${parsedInfo?.title || planningData?.data?.id}
Địa chỉ: ${parsedInfo?.address || planningData?.data?.address}
Loại đất: ${parsedInfo?.landType?.id || 'N/A'}
Tọa độ: ${selectedLocation ? `${selectedLocation[0]}, ${selectedLocation[1]}` : 'N/A'}
            `.trim();
            navigator.clipboard.writeText(info);
            alert('Đã copy thông tin đầy đủ!');
          }}
          className="px-2 py-1.5 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
        >
          📄 Info
        </button>
      </div>

      {/* Map Layer Controls from Geocoding - Removed and moved to a separate component */}
      {planningData?.geocodingData?.data?.html && (
        <div className="bg-orange-50 p-3 rounded border-l-2 border-orange-400">
          <div className="font-medium text-orange-800 text-xs mb-2">🗺️ Các loại bản đồ</div>
          <div 
            className="geocoding-controls text-xs"
            dangerouslySetInnerHTML={{ __html: planningData.geocodingData.data.html }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Component for displaying map types selector embedded at the bottom of the map
 */
function MapTypesSelector({ 
  geocodingHtml,
  onLayerSwitch 
}: {
  geocodingHtml?: string;
  onLayerSwitch?: (layerType: string, url: string, name: string) => void;
}) {
  // Handle click events on geocoding control buttons
  useEffect(() => {
    if (!geocodingHtml || !onLayerSwitch) return;

    const handleControlClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.btn--map-switch') as HTMLElement;
      
      if (button) {
        event.preventDefault();
        event.stopPropagation();
        
        const layerType = button.getAttribute('data-type') || '';
        const url = button.getAttribute('data-url') || '';
        const name = button.getAttribute('data-name') || button.textContent || '';
        
        if (url && layerType) {
          onLayerSwitch(layerType, url, name);
          
          // Update active states
          const allButtons = document.querySelectorAll('.btn--map-switch');
          allButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
        }
      }
    };

    // Add click listeners after rendering the HTML content
    setTimeout(() => {
      const buttons = document.querySelectorAll('.btn--map-switch');
      buttons.forEach(button => {
        button.addEventListener('click', handleControlClick);
      });
    }, 100);
    
    return () => {
      const buttons = document.querySelectorAll('.btn--map-switch');
      buttons.forEach(button => {
        button.removeEventListener('click', handleControlClick);
      });
    };
  }, [geocodingHtml, onLayerSwitch]);

  // Return nothing - the HTML is already rendered in the parent component
  return null;
}

// Component for parsing and displaying HTML content
function PlanningInfoDisplay({ htmlContent }: { htmlContent: string }) {  const [parsedInfo, setParsedInfo] = useState<{
    title: string;
    address: string;
    planningInfo: Array<{ area: string; type: string; details: string; color: string }>;
    coordinates: { lat: number; lng: number } | null;
    itemId: string;
    landType: { id: string; area: string; description: string } | null;
  } | null>(null);
  useEffect(() => {
    if (htmlContent) {
      try {
        console.log('Raw HTML content:', htmlContent); // Debug log
        
        // Parse HTML and extract useful information
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extract title (thông tin thửa đất)
        const titleElement = doc.querySelector('.sqh-pin-inf__tle');
        const title = titleElement?.textContent?.trim() || '';
        
        // Extract address (địa chỉ)
        const addressElement = doc.querySelector('.sqh-pin-inf__adr');
        const address = addressElement?.textContent?.trim() || '';
        
        // Extract coordinates from hidden form fields
        const latInput = doc.querySelector('input[name="lat"]') as HTMLInputElement;
        const lngInput = doc.querySelector('input[name="lng"]') as HTMLInputElement;
        const itemIdInput = doc.querySelector('input[name="item_id"]') as HTMLInputElement;
        
        const coordinates = latInput && lngInput ? {
          lat: parseFloat(latInput.value),
          lng: parseFloat(lngInput.value)
        } : null;
          const itemId = itemIdInput?.value || '';
        
        // Extract land type info (.type-info)
        const typeInfoElement = doc.querySelector('.type-info');
        let landType = null;
        if (typeInfoElement) {
          const typeId = typeInfoElement.querySelector('.type-info__id')?.textContent?.trim() || '';
          const typeArea = typeInfoElement.querySelector('.type-info__sqr')?.textContent?.trim() || '';
          const typeDescription = typeInfoElement.querySelector('.type-info__txt')?.textContent?.trim() || '';
          landType = { id: typeId, area: typeArea, description: typeDescription };
        }
        
        // Extract planning info - Try multiple methods
        let planningInfo: Array<{ area: string; type: string; details: string; color: string }> = [];
        
        // Method 1: Original format with .text-col and .text-col__lbl
        const textCols = Array.from(doc.querySelectorAll('.text-col'));
        if (textCols.length > 0) {
          planningInfo = textCols.map(col => {
            const areaElement = col.querySelector('.text-col__lbl');
            const area = areaElement?.textContent?.trim() || '';
            
            const typeElement = col.querySelector('.text-col__txt div[style*="background-color"]');
            const type = typeElement?.textContent?.trim() || '';
            
            // Extract background color from style attribute
            const styleAttr = typeElement?.getAttribute('style') || '';
            const colorMatch = styleAttr.match(/background-color:\s*([^;]+)/);
            const color = colorMatch ? colorMatch[1].trim() : '#gray';
            
            // Get details from the second div in text-col__txt
            const detailsElement = col.querySelector('.text-col__txt div:last-child');
            const details = detailsElement?.textContent?.trim() || '';
            
            return { area, type, details, color };
          }).filter(item => item.area && item.type);
        }
        
        // Method 2: New format with .text-col__txt having style directly
        if (planningInfo.length === 0) {
          const directStyleElements = Array.from(doc.querySelectorAll('.text-col__txt[style*="background-color"]'));
          planningInfo = directStyleElements.map((element) => {
            const type = element.textContent?.trim() || '';
            const styleAttr = element.getAttribute('style') || '';
            const colorMatch = styleAttr.match(/background-color:\s*([^;]+)/);
            const color = colorMatch ? colorMatch[1].trim() : '#gray';
            
            // For new format, area might be in the title or we use 'N/A'
            const area = 'Xem thông tin thửa đất'; // Fallback
            
            return { area, type, details: '', color };
          }).filter(item => item.type);
        }        console.log('Parsed planning info:', planningInfo); // Debug log

        setParsedInfo({ title, address, planningInfo, coordinates, itemId, landType });
      } catch (error) {
        console.error('Error parsing HTML content:', error);
        setParsedInfo(null);
      }
    }
  }, [htmlContent]);

  if (!parsedInfo) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Không thể phân tích HTML</h4>
          <p className="text-yellow-700 text-sm">
            Dữ liệu HTML không thể được phân tích tự động. Xem raw HTML bên dưới:
          </p>
        </div>
        <details className="bg-gray-50 p-4 rounded-lg border">
          <summary className="font-medium text-gray-700 cursor-pointer mb-2">
            Xem raw HTML (debug)
          </summary>
          <div className="bg-white p-3 rounded border">
            <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {htmlContent}
            </pre>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thông tin thửa đất */}
      {parsedInfo.title && (
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-semibold text-blue-800 mb-2">📍 Thông tin thửa đất</h4>
          <p className="text-blue-700 font-medium">{parsedInfo.title}</p>
          {parsedInfo.itemId && (
            <p className="text-sm text-blue-600 mt-1">ID: {parsedInfo.itemId}</p>
          )}
        </div>
      )}
      
      {/* Loại đất */}
      {parsedInfo.landType && (
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
          <h4 className="font-semibold text-orange-800 mb-2">🏷️ Thông tin loại đất</h4>
          <div className="space-y-1">
            <p className="text-orange-700"><span className="font-medium">Mã:</span> {parsedInfo.landType.id}</p>
            <p className="text-orange-700"><span className="font-medium">Diện tích:</span> {parsedInfo.landType.area}</p>
            <p className="text-orange-700"><span className="font-medium">Loại:</span> {parsedInfo.landType.description}</p>
          </div>
        </div>
      )}
      
      {/* Địa chỉ */}
      {parsedInfo.address && (
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <h4 className="font-semibold text-green-800 mb-2">📍 Địa chỉ</h4>
          <p className="text-green-700">{parsedInfo.address}</p>
        </div>
      )}
      
      {/* Tọa độ */}
      {parsedInfo.coordinates && (
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
          <h4 className="font-semibold text-purple-800 mb-2">🌐 Tọa độ</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-purple-700">Latitude:</span>
              <p className="text-purple-600 font-mono">{parsedInfo.coordinates.lat}</p>
            </div>
            <div>
              <span className="font-medium text-purple-700">Longitude:</span>
              <p className="text-purple-600 font-mono">{parsedInfo.coordinates.lng}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Thông tin quy hoạch xây dựng */}
      {parsedInfo.planningInfo.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
          <h4 className="font-semibold text-gray-800 mb-3">🏗️ Thông tin quy hoạch xây dựng</h4>
          <div className="space-y-3">
            {parsedInfo.planningInfo.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-5 h-5 rounded mt-1 flex-shrink-0 border"
                    style={{ backgroundColor: item.color }}
                    title={`Màu: ${item.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-800 leading-tight">{item.type}</h5>
                      <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {item.area}
                      </span>
                    </div>
                    {item.details && (
                      <p className="text-sm text-gray-600 leading-relaxed">{item.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lưu ý */}
      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng</h4>
        <p className="text-sm text-yellow-700 leading-relaxed">
          Dữ liệu này chỉ mang tính chất tham khảo. Vui lòng căn cứ theo màu sắc, ký hiệu đất trên từng loại bản đồ 
          và kiểm tra lại với cơ quan chức năng có thẩm quyền trước khi thực hiện các giao dịch bất động sản.
        </p>
      </div>      {/* Actions */}
      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
        <h4 className="font-semibold text-gray-800 mb-3">🔧 Thao tác</h4>
        <div className="grid grid-cols-2 gap-3">
          {parsedInfo.coordinates && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${parsedInfo.coordinates.lat},${parsedInfo.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <span>🗺️</span>
              <span>Mở Google Maps</span>
            </a>
          )}
          <button
            onClick={() => {
              if (parsedInfo.coordinates) {
                navigator.clipboard.writeText(`${parsedInfo.coordinates.lat}, ${parsedInfo.coordinates.lng}`);
                alert('Đã copy tọa độ vào clipboard!');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <span>📋</span>
            <span>Copy tọa độ</span>
          </button>
        </div>
      </div>
      
      {/* Thông tin gốc từ API */}
      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
        <h4 className="font-semibold text-orange-800 mb-3">📜 Thông tin dạng text</h4>
        <div className="bg-white rounded-lg border p-4 max-h-96 overflow-y-auto">
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
        <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
          <p>
            <strong>Lưu ý:</strong> Đây là nội dung HTML gốc từ API. Một số phần tử có thể không hiển thị đầy đủ do 
            thiếu CSS hoặc JavaScript từ trang web gốc.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility function to add a small random jitter to coordinates
 * This helps avoid cache issues with repeated API calls to the same coordinates
 */
const getJitteredCoordinates = (lat: number, lng: number, amount = 0.0000001) => {
  const jitteredLat = lat + (Math.random() * amount - amount/2);
  const jitteredLng = lng + (Math.random() * amount - amount/2);
  return { lat: jitteredLat, lng: jitteredLng };
};

/**
 * Generate random coordinates within the Hanoi area
 */
const getRandomHanoiCoordinates = () => {
  // Approximate bounding box for Hanoi
  const hanoiBounds = {
    minLat: 20.9500, // South
    maxLat: 21.0850, // North
    minLng: 105.7000, // West
    maxLng: 105.9000  // East
  };
  
  // Generate random coordinates within bounds
  const lat = hanoiBounds.minLat + (Math.random() * (hanoiBounds.maxLat - hanoiBounds.minLat));
  const lng = hanoiBounds.minLng + (Math.random() * (hanoiBounds.maxLng - hanoiBounds.minLng));
  
  return { lat, lng };
};

interface HanoiPlanningMapProps {
  height?: string;
  showControls?: boolean;
  className?: string;
  baseMapType?: 'geoapify' | 'google-satellite' | 'google-hybrid';
}

/**
 * Component hiển thị các nút chọn loại bản đồ
 */
function MapTypeButtons({ 
  onLayerSwitch 
}: { 
  onLayerSwitch: (layerType: string, url: string, name: string) => void 
}) {
  const [activeButton, setActiveButton] = useState<string>('QH 2030');
  
  // Danh sách các loại bản đồ
  const mapTypes = [
    { id: 'qh2030', name: 'QH 2030', layerType: 'layer_1', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-2030-2/{z}/{x}/{y}.png', color: '#7dd3fc' },
    { id: 'kh2025', name: 'KH 2025', layerType: 'layer_2022', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-2022/{z}/{x}/{y}.png', color: '#a5b4fc' },
    { id: 'qh500', name: 'QH 1/500, 1/2000', layerType: 'layer_qhpk', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-qhpk/{z}/{x}/{y}.png', color: '#fca5a5' },
    { id: 'qhpk', name: 'QH phân khu', layerType: 'layer_qhpk_2', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-qhpk-2/{z}/{x}/{y}.png', color: '#fdba74' },
    { id: 'qhxd', name: 'QH xây dựng', layerType: 'layer_qhpk_qhxd', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-qhpk-qhxd/{z}/{x}/{y}.png', color: '#86efac' },
    { id: 'qhkhac', name: 'QH khác', layerType: 'layer_1', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-2030-2/{z}/{x}/{y}.png', color: '#d8b4fe' }
  ];
  
  const handleButtonClick = (mapType: typeof mapTypes[0]) => {
    setActiveButton(mapType.name);
    onLayerSwitch(mapType.layerType, mapType.url, mapType.name);
  };
  
  return (
    <div className="flex flex-wrap justify-center">
      {mapTypes.map((mapType) => (
        <button
          key={mapType.id}
          onClick={() => handleButtonClick(mapType)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors border-t border-l border-r rounded-t-md ${
            activeButton === mapType.name
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
          }`}
          style={{
            backgroundColor: activeButton === mapType.name ? mapType.color : undefined,
            marginRight: '1px',
            marginBottom: '-1px',
            position: 'relative',
            zIndex: activeButton === mapType.name ? 5 : 1
          }}
        >
          {mapType.name}
        </button>
      ))}
    </div>
  );
}

export default function HanoiPlanningMap({ 
  height = '600px', 
  showControls = true,
  className = '',
  baseMapType = 'google-hybrid'
}: HanoiPlanningMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [geoapifyApiKey, setGeoapifyApiKey] = useState<string | null>(null);
  const [planningData, setPlanningData] = useState<PlanningData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [currentBaseMap, setCurrentBaseMap] = useState<'geoapify' | 'google-satellite' | 'google-hybrid'>(baseMapType);
  const [baseMapOpacity, setBaseMapOpacity] = useState(0.6);
  const [layer1Opacity, setLayer1Opacity] = useState(0.8);
  const [layer2Opacity, setLayer2Opacity] = useState(0.6);
  const [showBaseMap, setShowBaseMap] = useState(true);
  const [showLayer1, setShowLayer1] = useState(true);
  const [showLayer2, setShowLayer2] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [showPlanningOverlay, setShowPlanningOverlay] = useState(false);
  const [activeMapType, setActiveMapType] = useState<string>('QH 2030');
  const planningOverlaysRef = useRef<L.DivOverlay[]>([]);
  const [selectedPlanningArea, setSelectedPlanningArea] = useState<any>(null);
  const [layer1Url, setLayer1Url] = useState('https://l5cfglaebpobj.vcdn.cloud/ha-noi-2030-2/{z}/{x}/{y}.png');
  const [layer1Name, setLayer1Name] = useState('Quy hoạch Hà Nội 2030');
  const [geocodingData, setGeocodingData] = useState<any>(null);
  const geocodingFetched = useRef(false);

  // Tọa độ trung tâm Hà Nội
  const center: [number, number] = [21.0285, 105.8542];

  // Predefined map types for consistent usage
  const mapTypes = [
    { id: 'qh2030', name: 'QH 2030', layerType: 'layer_1', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-2030-2/{z}/{x}/{y}.png', color: '#7dd3fc' },
    // { id: 'kh2025', name: 'KH 2025', layerType: 'layer_2022', url: 'https://s3-hn-2.cloud.cmctelecom.vn/guland9/qh-2025/ha-noi/quan-ha-dong/{z}/{x}/{y}.png', color: '#a5b4fc' },
    { id: 'qh500', name: 'QH 1/500, 1/2000', layerType: 'layer_qhpk', url: 'https://s3-han02.fptcloud.com/guland/hn-qhxd-2/{z}/{x}/{y}.png', color: '#fca5a5' },
    { id: 'qhpk', name: 'QH phân khu', layerType: 'layer_qhpk_2', url: 'https://s3-hn-2.cloud.cmctelecom.vn/guland4/hanoi-qhpk2/{z}/{x}/{y}.png', color: '#fdba74' },
    { id: 'qhxd', name: 'QH xây dựng', layerType: 'layer_qhpk_qhxd', url: 'https://s3-hn-2.cloud.cmctelecom.vn/guland4/hanoi-qhpk2/{z}/{x}/{y}.png', color: '#86efac' },
    { id: 'qhkhac', name: 'QH khác', layerType: 'layer_1', url: 'https://l5cfglaebpobj.vcdn.cloud/ha-noi-2030-2/{z}/{x}/{y}.png', color: '#d8b4fe' }
  ];

  // Set default layer to QH 2030 on first render
  useEffect(() => {
    if (isClient && !geocodingFetched.current) {
      // Use the first map type (QH 2030) as default
      setLayer1Url(mapTypes[0].url);
      setLayer1Name(mapTypes[0].name);
      setActiveMapType(mapTypes[0].name);
    }
  }, [isClient]);

  // Fetch geocoding data once when component mounts
  useEffect(() => {
    // Skip if already fetched or not client-side
    if (!isClient || geocodingFetched.current) return;
    
    const fetchGeocodingData = async () => {
      try {
        console.log('🌍 Fetching initial geocoding data...');
        
        // Slightly randomize coordinates to avoid cache issues
        const jittered = getJitteredCoordinates(
          21.0277644, // Base lat for Hanoi
          105.8341598, // Base lng for Hanoi
          0.0000001 // Very small jitter to avoid cache
        );
        
        const response = await fetch('/api/guland-proxy/geocoding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: jittered.lat,
            lng: jittered.lng,
            path: "soi-quy-hoach/ha-noi"
          }),
        });
        
        const data = await response.json();
        console.log('🌐 Geocoding response:', data);
        
        if (data?.success && data?.data) {
          setGeocodingData(data);
          
          // Extract map layer URLs from the HTML content if available
          if (data.data?.html) {
            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(data.data.html, 'text/html');
              
              // Find the QH 2030 button (or first map type button)
              const defaultButton = doc.querySelector('#btn-2030') || 
                                   doc.querySelector('.btn--map-switch[data-type="layer_1"]');
                
              if (defaultButton) {
                const url = defaultButton.getAttribute('data-url');
                const name = defaultButton.getAttribute('data-name') || defaultButton.textContent?.trim() || 'QH 2030';
                
                if (url) {
                  console.log(`🗺️ Found default layer URL from API: ${url}`);
                  setLayer1Url(url);
                  setLayer1Name(name);
                  setActiveMapType(name);
                }
              }
            } catch (parseError) {
              console.error('Error parsing HTML content:', parseError);
            }
          }
          // Default to first mapType if couldn't extract from HTML
          else if (data.data?.url) {
            setLayer1Url(data.data.url);
            setLayer1Name(data.data.name || 'Quy hoạch Hà Nội');
          }
        }
        
        // Mark as fetched so we don't fetch again
        geocodingFetched.current = true;
      } catch (error) {
        console.error('❌ Error fetching geocoding data:', error);
      }
    };
    
    fetchGeocodingData();
  }, [isClient]);

  // Function to call planning API
  const handleMapClick = async (lat: number, lng: number) => {
    // Clear previous data first
    setPlanningData(null);
    setError(null);
    
    setIsLoading(true);
    setSelectedLocation([lat, lng]);

    console.log('Map clicked at:', lat, lng); // Debug log

    try {
      // Call planning API
      const planningResponse = await fetch('/api/guland-proxy/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marker_lat: lat,
          marker_lng: lng,
          province_id: 1 // Default to Hà Nội
        }),
      });

      const planningData: PlanningData = await planningResponse.json();
      console.log('Planning API response:', planningData); // Debug log
      
      // Combine with existing geocoding data
      setPlanningData({
        ...planningData,
        geocodingData: geocodingData
      });
      
      // Check if we have HTML data
      if (planningData?.data?.html) {
        console.log('HTML data found, length:', planningData.data.html.length); // Debug log
      } else {
        console.log('No HTML data in response'); // Debug log
      }
    } catch (err) {
      console.error('Planning API error:', err); // Debug log
      setError('Lỗi khi lấy thông tin quy hoạch: ' + (err as Error).message);
      setPlanningData(null); // Ensure planningData is null on error
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle layer switching from geocoding controls
  const handleLayerSwitch = (layerType: string, url: string, name: string) => {
    console.log('Switching layer:', { layerType, url, name });
    
    // Check if URL is valid
    if (!url) {
      console.warn('Missing URL for layer:', layerType, name);
      return;
    }
    
    // Set layer data
    setLayer1Url(url);
    setLayer1Name(name || 'Quy hoạch');
    setActiveMapType(name || layerType);
    console.log(`Đã chuyển sang layer: ${name}`);
    
    // Update all buttons with the same data-type and URL
    setTimeout(() => {
      const allButtons = document.querySelectorAll('.btn--map-switch');
      allButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === layerType && 
            btn.getAttribute('data-url') === url) {
          btn.classList.add('active');
        }
      });
    }, 100);
  };

  // Add effect to handle map type button clicks
  useEffect(() => {
    if (!isClient) return;

    const handleMapTypeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.btn--map-switch') as HTMLButtonElement;
      
      if (button) {
        event.preventDefault();
        event.stopPropagation();
        
        const layerType = button.getAttribute('data-type') || '';
        const url = button.getAttribute('data-url') || '';
        const name = button.getAttribute('data-name') || button.textContent?.trim() || '';
        
        if (url && layerType) {
          handleLayerSwitch(layerType, url, name);
        }
      }
    };

    // Add event listener
    document.addEventListener('click', handleMapTypeClick);
    
    return () => {
      document.removeEventListener('click', handleMapTypeClick);
    };
  }, [isClient]);

  // Manual zoom functions
  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  }, [mapInstance]);

  const handleResetZoom = useCallback(() => {
    if (mapInstance) {
      mapInstance.setView(center, 15);
    }
  }, [mapInstance, center]);

  // Fullscreen functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const mapElement = document.querySelector('.map-container');
      if (mapElement && mapElement.requestFullscreen) {
        mapElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    // Get Geoapify API key
    try {
      const apiKey = getGeoapifyApiKey();
      setGeoapifyApiKey(apiKey);
    } catch (error) {
      console.warn('Geoapify API key not found:', error);
    }
    
    // Fix for default markers in react-leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Add custom CSS for planning overlays
    const style = document.createElement('style');
    style.textContent = `
      .planning-text-overlay {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        pointer-events: none;
      }
      .planning-text-overlay .leaflet-tooltip-content {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .planning-overlay {
        pointer-events: auto;
        cursor: pointer;
        z-index: 1000;
      }
      .planning-overlay:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease;
      }
      
      /* Backdrop for popup */
      .planning-detail-backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
      }
      
      /* Custom styling for planning popup */
      .planning-popup .leaflet-popup-content-wrapper {
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        background: white;
        max-height: 400px;
        overflow: hidden;
        min-width: 280px;
        max-width: 320px;
      }
      
      .planning-popup .leaflet-popup-content {
        margin: 0;
        padding: 0;
        max-height: 400px;
        overflow: hidden;
        width: 100% !important;
      }
      
      .planning-popup .leaflet-popup-close-button {
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        color: #6b7280;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
      }
      
      .planning-popup .leaflet-popup-close-button:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
        border-color: #fca5a5;
      }
      
      .planning-popup .leaflet-popup-tip {
        background: white;
        border: 1px solid #e5e7eb;
      }
      
      .planning-html-content {
        font-size: 14px;
        line-height: 1.5;
      }
      
      .planning-html-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
      }
      
      .planning-html-content table td,
      .planning-html-content table th {
        padding: 6px 8px;
        border: 1px solid #e5e7eb;
        text-align: left;
        font-size: 13px;
      }
      
      .planning-html-content table th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #374151;
      }
      
      .planning-html-content table tr:nth-child(even) {
        background-color: #f9fafb;
      }
      
      .planning-html-content strong {
        color: #1f2937;
        font-weight: 600;
      }
      
      .planning-html-content p {
        margin: 6px 0;
      }
      
      /* Style for raw HTML content */
      .planning-raw-html {
        font-family: inherit;
      }
      
      .planning-raw-html .sqh-pin-inf__tle {
        font-weight: bold;
        font-size: 13px;
        color: #1f2937;
        margin-bottom: 4px;
        display: block;
      }
      
      .planning-raw-html .sqh-pin-inf__adr {
        color: #6b7280;
        font-size: 11px;
        margin-bottom: 6px;
        display: block;
      }
      
      .planning-raw-html .type-info {
        background: #f3f4f6;
        padding: 8px;
        border-radius: 6px;
        margin: 8px 0;
        border-left: 4px solid #3b82f6;
      }
      
      .planning-raw-html .type-info__id {
        font-weight: bold;
        color: #1f2937;
      }
      
      .planning-raw-html .type-info__sqr {
        color: #059669;
        font-weight: 600;
      }
      
      .planning-raw-html .type-info__txt {
        color: #6b7280;
        font-size: 13px;
      }
      
      .planning-raw-html .text-col {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px;
        margin: 6px 0;
      }
      
      .planning-raw-html .text-col__lbl {
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }
      
      .planning-raw-html .text-col__txt {
        font-size: 13px;
      }
      
      .planning-raw-html .text-col__txt div {
        padding: 4px 8px;
        border-radius: 4px;
        margin: 2px 0;
      }
      
      /* Geocoding Controls Styling */
      .geocoding-controls {
        font-family: inherit;
      }
      
      .geocoding-controls .sqh-btn-btm__wrp {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .geocoding-controls .sqh-btn-btm__wrp li {
        list-style: none;
        margin: 0;
      }
      
      .geocoding-controls .btn {
        display: inline-block;
        padding: 4px 8px;
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .geocoding-controls .btn:hover {
        background: #e5e7eb;
        color: #1f2937;
        border-color: #9ca3af;
      }
      
      .geocoding-controls .btn.active {
        background: #3b82f6;
        color: white;
        border-color: #2563eb;
      }
      
      .geocoding-controls .btn--sqh-btm {
        margin: 0;
      }
      
      .geocoding-controls .sqh-adr-btm {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
      }
      
      .geocoding-controls .sqh-adr-btm__txt {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #6b7280;
        font-size: 10px;
      }
      
      .geocoding-controls .sqh-adr-btm__txt i {
        color: #9ca3af;
      }
      
      .geocoding-controls .btn--brch-ctc {
        background: #10b981;
        color: white;
        border-color: #059669;
        font-size: 10px;
        padding: 3px 6px;
      }
      
      .geocoding-controls .btn--brch-ctc:hover {
        background: #059669;
        border-color: #047857;
      }
      
      /* Hide modal and other complex elements */
      .geocoding-controls #Modal-MapTutorialVideo,
      .geocoding-controls .modal {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">Đang tải bản đồ...</p>
      </div>
    );
  }

  // Một số điểm demo trên bản đồ Hà Nội
  const demoPoints = [
    {
      id: 1,
      name: "Hồ Hoàn Kiếm",
      position: [21.0285, 105.8542] as [number, number],
      description: "Trung tâm lịch sử của Hà Nội"
    },
    {
      id: 2,
      name: "Khu vực Cầu Giấy",
      position: [21.0337, 105.7981] as [number, number],
      description: "Khu đô thị mới, trung tâm công nghệ"
    },
    {
      id: 3,
      name: "Khu vực Thanh Xuân",
      position: [20.9876, 105.8125] as [number, number],
      description: "Khu dân cư đông đúc"
    }
  ];
  return (
    <div className={className}>
      {/* Map Container */}
      <div className={`map-container rounded-lg overflow-hidden relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-black' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
        <MapContainer
          center={center}
          zoom={15}
          minZoom={8}
          maxZoom={25}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
        >
          <MapClickHandler 
            onMapClick={handleMapClick} 
            onZoomChange={setCurrentZoom}
            onMapReady={setMapInstance}
          />
          
          {/* Planning Overlay Manager */}
          <PlanningOverlayManager 
            map={mapInstance}
            showOverlay={showPlanningOverlay}
            planningData={planningData}
            overlaysRef={planningOverlaysRef}
            onAreaClick={setSelectedPlanningArea}
          />
          
          {/* Custom Zoom Control */}
          {showControls && (
            <ZoomControl position="bottomright" />
          )}
          
          {/* Base Map Layer - Luôn ở dưới cùng */}
          {showBaseMap && currentBaseMap === 'geoapify' && geoapifyApiKey && (
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyApiKey}`}
              attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={25}
              maxNativeZoom={18}
              minZoom={8}
              opacity={baseMapOpacity}
              zIndex={1}
            />
          )}
          
          {showBaseMap && currentBaseMap === 'google-satellite' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://maps.google.com/">Google</a>'
              maxZoom={25}
              maxNativeZoom={20}
              minZoom={8}
              opacity={baseMapOpacity}
              zIndex={1}
            />
          )}
          
          {showBaseMap && currentBaseMap === 'google-hybrid' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://maps.google.com/">Google</a>'
              maxZoom={25}
              maxNativeZoom={20}
              minZoom={8}
              opacity={baseMapOpacity}
              zIndex={1}
            />
          )}
          
          {/* Layer 1: Bản đồ quy hoạch Hà Nội 2030 - Luôn ở trên base map */}
          {showLayer1 && (
            <TileLayer
            key={layer1Url} // Add key to force re-render when URL changes
            url={layer1Url}
            attribution={`&copy; ${layer1Name}`}
            maxZoom={25}
            maxNativeZoom={18}
            minZoom={8}
            opacity={layer1Opacity}
            zIndex={10}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          )}
          
          {/* Layer 2: Bản đồ đất đai Hà Nội - Ở trên cùng */}
          {showLayer2 && (
            <TileLayer
            url="https://s3-hn-2.cloud.cmctelecom.vn/guland7/land/ha-noi/{z}/{x}/{y}.png"
            attribution='&copy; Bản đồ đất đai Hà Nội'
            maxZoom={25}
            maxNativeZoom={18}
            minZoom={8}
            opacity={layer2Opacity}
            zIndex={20}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          )}
          
          {/* Simple marker without popup */}
          {selectedLocation && (
            <Marker position={selectedLocation}>
            </Marker>
          )}

          {/* Planning polygon */}
          {planningData?.data?.points && planningData.data.points.length > 0 && (
            <Polygon
              positions={planningData.data.points.map(p => [p.lat, p.lng] as [number, number])}
              color="red"
              fillColor="red"
              fillOpacity={0.3}
              weight={2}
            >
              <Popup>
                <div className="p-2 max-w-sm">
                  <h3 className="font-semibold">Thông tin thửa đất</h3>
                  <p className="text-sm mb-2">{planningData.data.address}</p>
                  <div className="text-xs text-gray-600">
                    <p>ID: {planningData.data.id}</p>
                    <p>Tỉnh/TP: {planningData.data.province_id}</p>
                    <p>Quận/Huyện: {planningData.data.district_id}</p>
                    <p>Phường/Xã: {planningData.data.ward_id}</p>
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}
          {/* Các marker demo */}
          {demoPoints.map((point) => (
            <Marker key={point.id} position={point.position}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg">{point.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{point.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Tọa độ: {point.position[0]}, {point.position[1]}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Map Types Selector - Embedded directly in map */}
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 border-t shadow-md p-2 z-[1000]">
          <div className="flex flex-nowrap justify-center gap-1 overflow-x-auto pb-1">
            {mapTypes.map((mapType) => (
              <button
                key={mapType.id}
                onClick={() => handleLayerSwitch(mapType.layerType, mapType.url, mapType.name)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border rounded-md whitespace-nowrap ${
                  activeMapType === mapType.name
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                style={{
                  backgroundColor: activeMapType === mapType.name ? mapType.color : undefined,
                }}
                data-type={mapType.layerType}
                data-url={mapType.url}
                data-name={mapType.name}
              >
                {mapType.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border z-[1000] max-w-xs">
          {/* Header with toggle button */}
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-semibold text-sm">💡 Hướng dẫn</h4>
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={isControlsExpanded ? "Thu gọn" : "Mở rộng"}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isControlsExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Collapsible content */}
          {isControlsExpanded && (
            <div className="p-3">
              <p className="text-xs text-gray-600 mb-2">
                Click vào bản đồ để xem thông tin quy hoạch chi tiết tại vị trí đó
              </p>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span>Zoom level:</span>
                  <span className="font-mono font-semibold">{currentZoom}/25</span>
                  {currentZoom > 18 && (
                    <span className="text-xs text-orange-600 ml-1">(vỡ pixel)</span>
                  )}
                </div>
                <div className="flex gap-1 mb-2">
                  <button
                    onClick={handleZoomIn}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                    title="Reset Zoom"
                  >
                    ⌂
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullscreen ? '⤡' : '⤢'}
                  </button>
                </div>
                
                {/* Remove Auto-geocoding toggle and status */}
                
                {/* Base Map Selector */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Base Map:</div>
                  <select
                    value={currentBaseMap}
                    onChange={(e) => setCurrentBaseMap(e.target.value as any)}
                    className="text-xs px-2 py-1 border rounded w-full bg-white"
                  >
                    <option value="google-hybrid">🛰️ Google Hybrid</option>
                    <option value="google-satellite">📍 Google Satellite</option>
                    {geoapifyApiKey && <option value="geoapify">🗺️ Geoapify</option>}
                  </select>
                  
                  {/* Layer Visibility Controls */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">Hiển thị layers:</div>
                    
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setShowBaseMap(!showBaseMap)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          showBaseMap 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title="Ẩn/hiện base map"
                      >
                        Base
                      </button>
                      <button
                        onClick={() => setShowLayer1(!showLayer1)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          showLayer1 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-200 text-blue-600 hover:bg-blue-300'
                        }`}
                        title="Ẩn/hiện layer quy hoạch"
                      >
                        QH
                      </button>
                      <button
                        onClick={() => setShowLayer2(!showLayer2)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          showLayer2 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-200 text-green-600 hover:bg-green-300'
                        }`}
                        title="Ẩn/hiện layer đất đai"
                      >
                        ĐĐ
                      </button>
                      <button
                        onClick={() => setShowPlanningOverlay(!showPlanningOverlay)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          showPlanningOverlay 
                            ? 'bg-yellow-600 text-white' 
                            : 'bg-yellow-200 text-yellow-600 hover:bg-yellow-300'
                        }`}
                        title="Ẩn/hiện text overlay quy hoạch"
                      >
                        📝
                      </button>
                    </div>
                  </div>
                  
                  {/* Layer Opacity Controls */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">Độ mờ layers:</div>
                    
                    {showBaseMap && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">Base:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={baseMapOpacity}
                          onChange={(e) => setBaseMapOpacity(parseFloat(e.target.value))}
                          className="flex-1 h-1"
                        />
                        <span className="text-xs w-8">{Math.round(baseMapOpacity * 100)}%</span>
                      </div>
                    )}
                    
                    {showLayer1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">QH:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer1Opacity}
                          onChange={(e) => setLayer1Opacity(parseFloat(e.target.value))}
                          className="flex-1 h-1"
                        />
                        <span className="text-xs w-8">{Math.round(layer1Opacity * 100)}%</span>
                      </div>
                    )}
                    
                    {showLayer2 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">ĐĐ:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer2Opacity}
                          onChange={(e) => setLayer2Opacity(parseFloat(e.target.value))}
                          className="flex-1 h-1"
                        />
                        <span className="text-xs w-8">{Math.round(layer2Opacity * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compact view when collapsed */}
          {!isControlsExpanded && (
            <div className="p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Zoom: {currentZoom}/25
                  {currentZoom > 18 && <span className="text-orange-600 ml-1">(vỡ pixel)</span>}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={handleZoomIn}
                    className="px-1.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="px-1.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="px-1.5 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullscreen ? '⤡' : '⤢'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Planning Area Detail Popup */}
        {selectedPlanningArea && (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 planning-detail-backdrop z-[1999]"
              onClick={() => setSelectedPlanningArea(null)}
            ></div>
            
            {/* Popup */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border z-[2000] max-w-md w-full mx-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Thửa {selectedPlanningArea.detailInfo.id}</h3>
                <p className="text-sm opacity-90">Diện tích {selectedPlanningArea.detailInfo.area}</p>
              </div>
              <button
                onClick={() => setSelectedPlanningArea(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                title="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Address */}
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-600">{selectedPlanningArea.detailInfo.address}</span>
              </div>

              {/* Land Type Badge */}
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 text-sm font-bold text-white rounded"
                  style={{ backgroundColor: selectedPlanningArea.color }}
                >
                  {selectedPlanningArea.detailInfo.landType}
                </span>
                <span className="text-sm text-gray-600">{selectedPlanningArea.detailInfo.area} đất ở tại đô thị</span>
              </div>

              {/* Planning Info */}
              <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 text-sm mb-1">THÔNG TIN QUY HOẠCH XÂY DỰNG</h4>
                <p className="text-yellow-700 text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                  {selectedPlanningArea.detailInfo.planningType}
                </p>
                <p className="text-yellow-600 text-xs mt-2">
                  {selectedPlanningArea.detailInfo.restrictions.join(', ')}
                </p>
              </div>

              {/* Building Ratio */}
              <div className="text-sm">
                <span className="font-medium text-gray-700">Hệ số sử dụng đất: </span>
                <span className="text-gray-600">{selectedPlanningArea.detailInfo.buildingRatio}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors">
                  🏠 Ký hiệu đất
                </button>
                <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors">
                  📍 Chỉ đường
                </button>
                <button className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors">
                  📏 Đo vẽ
                </button>
                <button className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded text-sm font-medium hover:bg-orange-200 transition-colors">
                  📊 Bảng tọa độ
                </button>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="bg-gray-50 p-3 rounded-b-lg border-t text-xs text-gray-500">
              📢 Đóng bản / Lưu thửa này lên bản đồ
            </div>
          </div>
          </>
        )}

        {/* Compact Planning Info Panel - Overlay inside map */}
        {(selectedLocation || isLoading || planningData) && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border overflow-hidden max-w-md w-11/12 z-[1000]">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">📍 Thông tin quy hoạch</span>
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setPlanningData(null);
                  setError(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                title="Đóng"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm">Đang tải thông tin...</span>
                </div>
              ) : error ? (
                <div className="text-red-600 text-sm">
                  <p className="font-medium">Lỗi:</p>
                  <p>{error}</p>
                </div>
              ) : planningData?.data ? (
                <PlanningInfoCompact 
                  planningData={planningData}
                  selectedLocation={selectedLocation}
                  onLayerSwitch={handleLayerSwitch}
                />
              ) : selectedLocation ? (
                <div className="text-gray-600 text-sm">
                  <p>Tọa độ: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}</p>
                  <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu quy hoạch</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
      
      {/* Map Type Buttons - Removed from outside the map container */}
      
      {/* ... existing code ... */}
    </div>
  );
}
