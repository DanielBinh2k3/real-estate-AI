import { type propertyValuationRange } from '@/ai/flows/property-valuation';
import { type propertyAnalysis } from '@/ai/flows/property-analysis';

export type ValuationResult = Awaited<ReturnType<typeof propertyValuationRange>>;
export type SummaryResult = Awaited<ReturnType<typeof propertyAnalysis>>;

export type PropertyInputSchema = {
  address: string;
  type: 'apartment' | 'lane_house' | 'town_house' | 'villa' | 'land' | 'shop_house';
  houseArea: number;
  landArea: number;
  facadeWidth: number;
  laneWidth: number;
  storyNumber: number;
  bedrooms: number;
  bathrooms: number;
  legal: 'contract' | 'white_book' | 'pink_book' | 'red_book';
};

export type SummaryDetails = {
  location: { score: number; details: string };
  utilities: { score: number; details: string };
  planning: { score: number; details: string };
  legal: { score: number; details: string };
  quality: { score: number; details: string };
};

// Real Estate types for comparable sales
export type RealEstate = {
  id: string;
  title: string;
  type: string;
  area: number;
  totalArea: number;
  address: {
    id: string;
    createdDate: string;
    modifiedDate: string;
    type: string;
    city: string;
    district: string;
    ward?: string;
    street?: string;
    administrativeLevel: number;
    addressCode?: string;
    name: string;
    detail: string;
  };
  geoLocation: [number, number];
  price: number;
  totalPrice: number;
  thumbnail: string;
  isExternal: boolean;
  saleStatus: string;
  contentScore: number;
  isExclusive: boolean;
  distanceToStreet: number;
  facadeNumber: number;
  facadeWidth: number;
  floorNumber: number;
  basementNumber: number;
  otherArea: number;
  floorArea: number;
  systemProduct: boolean;
  tokenized: boolean;
};

// API Response types for new format
export type ApiValuationResult = {
  valuation_result?: {
    realEstates?: RealEstate[];
    evaluation: {
      address: {
        type: string;
        city: string;
        district: string;
        ward: string;
        administrativeLevel: number;
      };
      bathRoom: number;
      bedRoom: number;
      builtYear: number;
      cityCenterDistance: number;
      cityLevel: number;
      clusterPrices: number[][];
      createdDate: string;
      districtCenterDistance: number;
      districtLevel: number;
      facadeWidth: number;
      geoLocation: [number, number];
      hasGarden: boolean;
      homeQualityRemaining: number;
      houseArea: number;
      housePrice: number;
      landArea: number;
      laneWidth: number;
      legal: string;
      modifiedDate: string;
      ownerId: number;
      price: number;
      radarScore: {
        descriptions: string[];
        dividendScore: number;
        evaluationScore: number;
        legalityScore: number;
        liquidityScore: number;
        locationScore: number;
      };
      storyNumber: number;
      totalPrice: number;
      transId: number;
      type: string;
      year: number;
    };
  };
  ai_valuation?: {
    success: boolean;
    data: {
      lowValue: number;
      reasonableValue: number;
      highValue: number;
      price_house: number;
    };
    error?: string;
  };
  ai_analysis?: {
    success: boolean;
    data: {
      radarScore: {
        legalityScore: number;
        liquidityScore: number;
        locationScore: number;
        evaluationScore: number;
        dividendScore: number;
        descriptions: string[];
      };
    };
    error?: string;
  };
  utilities?: {
    total: number;
    data: Utility[];
    groupedData: Record<UtilityType, Utility[]>;
  };
  price_trend?: {
    success: boolean;
    data: Array<{
      month: string;
      price: number;
      count: number;
      minPrice?: number;
      maxPrice?: number;
    }>;
    source?: string;
    error?: string;
  };
  success: boolean;
  error?: string | null;
  [key: string]: any;
};

// Combined type that supports both old and new formats
export type CombinedResult = {
  valuation: ValuationResult;
  summary: SummaryResult;
  summaryDetails: SummaryDetails;
} | ApiValuationResult;

// Utilities API types for resta.vn
export type UtilityType = 'hospital' | 'market' | 'restaurant' | 'cafe' | 'supermarket' | 'commercial_center';

export type Utility = {
  id: string;
  type: UtilityType;
  geoLocation: [number, number]; // [lng, lat]
  name: string;
  address: string;
  dimension: number;
  distance: number;
};

export type UtilitiesResponse = {
  total: number;
  data: Utility[];
};

export type UtilitiesParams = {
  types: UtilityType[];
  lat: number;
  lng: number;
  distance?: number; // in km, default 10
  size?: number; // number of results per type, default 5
};
