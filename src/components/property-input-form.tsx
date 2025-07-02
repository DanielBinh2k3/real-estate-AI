'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CombinedResult } from '@/lib/types';
import { 
  Home, 
  Loader2, 
  MapPin, 
  X, 
  Building, 
  Ruler, 
  FileText, 
  Layers,
  Bath,
  Bed,
  Square,
  TreeDeciduous,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDefaultAuthToken, getGeoapifyApiKey } from '@/lib/config';

const formSchema = z.object({
  address: z.string().min(5, 'Vui lòng nhập địa chỉ hợp lệ.'),
  type: z.enum(['apartment', 'lane_house', 'town_house', 'villa', 'land', 'shop_house'], {
    required_error: 'Vui lòng chọn loại bất động sản.',
  }),
  houseArea: z.coerce.number().min(10, 'Diện tích sàn phải lớn hơn 10m².'),
  landArea: z.coerce.number().min(10, 'Diện tích đất phải lớn hơn 10m².'),
  facadeWidth: z.coerce.number().min(1, 'Chiều rộng mặt tiền phải lớn hơn 1m.'),
  laneWidth: z.coerce.number().min(1, 'Chiều rộng đường/hẻm phải lớn hơn 1m.'),
  storyNumber: z.coerce.number().min(1, 'Phải có ít nhất 1 tầng.'),
  bedrooms: z.coerce.number().min(1, 'Phải có ít nhất 1 phòng ngủ.'),
  bathrooms: z.coerce.number().min(1, 'Phải có ít nhất 1 phòng tắm.'),
  legal: z.enum(['contract', 'white_book', 'pink_book', 'red_book'], {
    required_error: 'Vui lòng chọn tình trạng pháp lý.',
  }),
  yearBuilt: z.coerce.number().min(1900, 'Năm xây dựng phải từ 1900 trở lên.').max(new Date().getFullYear(), `Năm xây dựng không thể lớn hơn ${new Date().getFullYear()}.`),
});

// Property type options with Vietnamese labels
const propertyTypes = [
  // { value: 'apartment', label: 'Chung cư', icon: Building },
  { value: 'lane_house', label: 'Nhà trong hẻm', icon: Home },
  { value: 'town_house', label: 'Nhà phố', icon: Building },
  { value: 'villa', label: 'Biệt thự', icon: TreeDeciduous },
  { value: 'land', label: 'Đất nền', icon: Square },
  // { value: 'shop_house', label: 'Nhà mặt tiền', icon: Home },
] as const;

// Legal status options with Vietnamese labels
const legalOptions = [
  { value: 'red_book', label: 'Sổ đỏ' },
  { value: 'pink_book', label: 'Sổ hồng' },
  { value: 'white_book', label: 'Sổ trắng' },
  { value: 'contract', label: 'Hợp đồng' },
] as const;

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
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

type PropertyInputFormProps = {
  setResult: (data: CombinedResult | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  selectedLocation?: LocationData | null;
  onLocationSelect?: (location: LocationData) => void;
};

export function PropertyInputForm({
  setResult,
  setIsLoading,
  setError,
  selectedLocation,
  onLocationSelect,
}: PropertyInputFormProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '21°01\'41.9"N 105°51\'14.4"E, Phường Lý Thái Tổ, Quận Hoàn Kiếm, Hà Nội',
      type: 'lane_house',
      houseArea: 33,
      landArea: 33,
      facadeWidth: 3,
      laneWidth: 3,
      storyNumber: 4,
      bedrooms: 3,
      bathrooms: 2,
      legal: 'contract',
      yearBuilt: 2015,
    },
  });

  // Auto-fill address when location is selected from map
  useEffect(() => {
    if (selectedLocation?.address) {
      form.setValue('address', selectedLocation.address);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedLocation, form]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&lang=vi&limit=5&bias=countrycode:vn&apiKey=${getGeoapifyApiKey()}`
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
  };

  const handleSuggestionClick = async (suggestion: SearchSuggestion) => {
    form.setValue('address', suggestion.formatted);
    setShowSuggestions(false);
    
    if (onLocationSelect) {
      const locationData: LocationData = {
        latitude: suggestion.lat,
        longitude: suggestion.lon,
        address: suggestion.formatted,
      };
      onLocationSelect(locationData);
    }
    
    toast({
      title: "Đã chọn địa chỉ",
      description: suggestion.formatted,
    });
  };

  const handleAddressInputChange = (value: string) => {
    form.setValue('address', value);
    
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const clearAddressInput = () => {
    form.setValue('address', '');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedLocation?.latitude || !selectedLocation?.longitude) {
        setError('Vui lòng chọn vị trí trên bản đồ trước khi định giá.');
        setIsLoading(false);
        return;
      }

      const authToken = getDefaultAuthToken();

      const payload = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        property_details: {
          type: values.type,
          landArea: values.landArea,
          houseArea: values.houseArea,
          laneWidth: values.laneWidth,
          facadeWidth: values.facadeWidth,
          storyNumber: values.storyNumber,
          bedRoom: values.bedrooms,
          bathRoom: values.bathrooms,
          legal: values.legal,
          yearBuilt: values.yearBuilt,
        },
        auth_token: authToken,
      };

      const response = await fetch('/api/complete-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Check if AI valuation failed
        if (result.error) {
          setError(result.error);
          toast({
            title: "❌ Lỗi AI",
            description: result.error,
            variant: "destructive",
          });
          return;
        }
        
        // Check if AI valuation is missing or failed
        if (!result.ai_valuation?.success) {
          const aiError = result.ai_valuation?.error || 'AI Valuation failed';
          setError(aiError);
          toast({
            title: "❌ Lỗi định giá AI",
            description: aiError,
            variant: "destructive",
          });
          return;
        }
        
        setResult(result as CombinedResult);
        
        // Success notifications
        toast({
          title: "✅ Định giá thành công",
          description: "Phân tích AI hoàn tất",
        });
        
        if (result.error && result.error.includes('mock')) {
          toast({
            title: "⚠️ Thông báo",
            description: "Đang sử dụng dữ liệu mẫu do vấn đề với API thực tế",
            variant: "destructive",
          });
        }
      } else {
        setError(result.error || 'Định giá thất bại');
        toast({
          title: "❌ Lỗi",
          description: result.error || 'Định giá thất bại',
          variant: "destructive",
        });
      }
    } catch (error) {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.');
      console.error('Valuation error:', error);
    }
    
    setIsLoading(false);
  }

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-slate-800">Thông tin Bất động sản</h3>
            <p className="text-sm text-slate-600 font-normal">Chi tiết tài sản cần định giá</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Address Field */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Địa chỉ</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        ref={addressInputRef}
                        placeholder="Nhập địa chỉ..." 
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          handleAddressInputChange(e.target.value);
                        }}
                        onFocus={() => field.value.length > 1 && fetchSuggestions(field.value)}
                        className="pr-8"
                      />
                      {field.value && (
                        <button
                          type="button"
                          onClick={clearAddressInput}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Suggestions Dropdown */}
                      {showSuggestions && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {isLoadingSuggestions ? (
                            <div className="p-3 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto text-blue-500" />
                            </div>
                          ) : suggestions.length > 0 ? (
                            <div>
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={suggestion.place_id || index}
                                  type="button"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b last:border-b-0 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                    <span className="truncate">{suggestion.formatted}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-sm text-gray-500">
                              Không tìm thấy kết quả
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Legal */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Loại bất động sản</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => {
                          const IconComponent = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="legal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Pháp lý</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Chọn pháp lý" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {legalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Areas */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="landArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Diện tích đất (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="33" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="houseArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Diện tích sàn (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="33" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="facadeWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Mặt tiền (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="3.0" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="laneWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Đường/hẻm (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="3.0" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rooms & Stories */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="storyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Số tầng</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="4" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Phòng ngủ</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Phòng tắm</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Year Built */}
            <FormField
              control={form.control}
              name="yearBuilt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Năm xây dựng</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" placeholder="2015" {...field} className="h-10 pl-10" />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Đang định giá...</span>
                </>
              ) : (
                <>
                  <Home className="mr-2 h-4 w-4 text-white" />
                  <span className="text-white">Định giá bất động sản</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
