# ByteselAI - Real Estate Valuation Platform

A Next.js application for real estate property valuation using AI-powered analysis and Resta.vn APIs.

## Features

### 🏠 Property Valuation
- Complete property valuation flow using Resta.vn APIs
- AI-powered property analysis and scoring
- Market comparison and trend analysis
- Detailed property reports with location insights

### 🗺️ Interactive Map Integration
- **Geoapify Maps Integration**: Interactive map powered by Geoapify
- **Location Search**: Search for addresses using Geoapify Geocoding API
- **GPS Location**: Get current user location using browser geolocation
- **Click-to-Select**: Click on map to select property locations
- **Quick Location Buttons**: Fast access to popular cities (Hanoi, Ho Chi Minh, Da Nang)
- **Real-time Valuation**: Perform property valuation directly from map selection
- **Static Map Display**: Beautiful map visualization with location markers

### 📏 Distance Analysis (NEW!)
- **Administrative Centers Database**: Built-in coordinates for all 63 provinces/cities and districts in Vietnam
- **Smart Distance Calculation**: Calculate distances to city and district centers using Haversine formula
- **Accessibility Rating**: Automatic rating (excellent/good/fair/poor) based on distance to centers
- **Market Impact Analysis**: AI-powered location advantage and market impact assessment
- **Vietnamese Address Parsing**: Parse complex Vietnamese addresses to identify administrative units

### 📊 Data Visualization
- Radar charts for multi-criteria property scoring
- Market comparison charts
- Price trend analysis
- Comparable property sales data

### 🔗 API Integration
- Complete REST API backend with 4 endpoints:
  - `/api/location` - Get location info from coordinates
  - `/api/create-payload` - Create valuation payload
  - `/api/valuation` - Perform property valuation
  - `/api/complete-flow` - Complete valuation workflow

## Demo Pages

### 1. Main Dashboard (`/`)
Interactive property input form with complete valuation display and analysis.

### 2. Demo Page (`/demo`)
Static demo showcasing the complete application with sample data.

### 3. API Demo (`/demo-api`)
Three-tab interface for testing APIs:
- **Complete Flow**: One-click property valuation
- **Individual APIs**: Step-by-step API testing
- **Interactive Map**: New map-based property selection

### 4. Map Demo (`/map-demo`)
Dedicated page showcasing the interactive map features with detailed controls and result display.

### 5. Distance Analysis Demo (`/demo-distance`) (NEW!)
Interactive demo for testing the distance analysis feature with preset locations and custom coordinates.

### 6. Guland API Demo (`/demo-guland`) (NEW!)
Interactive demo for testing the Guland API integration:
- **Direct API Client**: Test Guland FastAPI server directly
- **NextJS Proxy**: Test through NextJS proxy endpoints
- **Health Check**: Test server connectivity
- **Planning Data**: Get property planning information
- **Geocoding**: Address/coordinate conversion

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Resta.vn API authentication token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd studio
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create `.env.local` file with:
```env
# Add your API keys here if needed
NEXT_PUBLIC_GEOAPIFY_API_KEY=your_geoapify_key

# Guland FastAPI Server Configuration (optional)
NEXT_PUBLIC_GULAND_SERVER_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Usage

### Using the Interactive Map
1. Navigate to `/demo-api` and click the "Interactive Map" tab
2. Search for an address or use current location
3. Click the red marker on the map to view location details
4. Enter your Resta.vn auth token
5. Click "Định giá tại vị trí này" to perform valuation

### Using Individual APIs
Test each API endpoint separately through the API demo interface:

1. **Get Location**: Enter coordinates to get location information
2. **Create Payload**: Generate valuation payload from location data
3. **Perform Valuation**: Execute property valuation with auth token

### Using Guland API Integration (NEW!)

#### Prerequisites
1. Run the Guland FastAPI server (provided separately)
2. Configure `NEXT_PUBLIC_GULAND_SERVER_URL` in your environment

#### Direct API Client Usage
```typescript
import { gulandApiClient } from '@/lib/guland-api-client';

// Health check
const health = await gulandApiClient.healthCheck();

// Get planning data
const planning = await gulandApiClient.getPlanningData({
  marker_lat: 10.779783071564157,
  marker_lng: 106.69747857570651,
  province_id: 79
});

// Geocoding
const geocoding = await gulandApiClient.geocoding({
  lat: 21.0277644,
  lng: 105.8341598,
  path: 'soi-quy-hoach/ha-noi'
});
```

#### NextJS Proxy Endpoints
- `/api/guland-proxy/health` - Health check (GET)
- `/api/guland-proxy/planning` - Planning data (POST)
- `/api/guland-proxy/geocoding` - Geocoding (GET/POST)
- `/api/guland-proxy/check-plan` - Check planning data (GET)
- `/api/guland-proxy/road-points` - Road points data (GET)
- `/api/guland-proxy/refresh-token` - Refresh CSRF token (POST)

#### Interactive Testing
Navigate to `/demo-guland` to test all Guland API features through an interactive interface.

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Maps**: Geoapify (Static Maps, Geocoding, Place Details)
- **Charts**: Recharts for data visualization
- **Backend**: Next.js API Routes
- **External APIs**: 
  - Resta.vn Real Estate APIs
  - Guland.vn Planning Data APIs (via FastAPI proxy)

## Map Features Powered by Geoapify

- **Static Map Tiles**: High-quality map rendering
- **Geocoding**: Address to coordinates conversion
- **Reverse Geocoding**: Coordinates to address conversion
- **Place Search**: Search for locations by name
- **Custom Markers**: Visual location indicators

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── guland-proxy/    # Guland API proxy endpoints
│   │   └── ...              # Other API routes
│   ├── demo/                # Static demo page
│   ├── demo-api/            # Interactive API testing
│   ├── demo-guland/         # Guland API demo (NEW!)
│   ├── map-demo/            # Map feature showcase
│   └── page.tsx             # Main dashboard
├── components/
│   ├── interactive-map-simple.tsx  # Map component
│   ├── property-input-form.tsx     # Property input
│   ├── valuation-display.tsx       # Results display
│   └── ui/                  # UI components (shadcn/ui)
└── lib/
    ├── guland-api-client.ts # Guland API client (NEW!)
    ├── types.ts             # TypeScript definitions
    └── utils.ts             # Utility functions
```

## API Endpoints

### POST `/api/complete-flow`
Complete property valuation workflow.

**Request:**
```json
{
  "latitude": 21.0282993,
  "longitude": 105.8539963,
  "property_details": {
    "type": "town_house",
    "landArea": 60.0,
    "houseArea": 55.0,
    "bedRoom": 3,
    "bathRoom": 2,
    "legal": "pink_book"
  },
  "auth_token": "Bearer ..."
}
```

**Response:**
```json
{
  "success": true,
  "input_coordinates": [21.0282993, 105.8539963],
  "location_info": {...},
  "parsed_address": {...},
  "valuation_payload": {...},
  "valuation_result": {...}
}
```

### GET `/api/location`
Get location information from coordinates.

**Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate

### POST `/api/create-payload`
Create valuation payload from address and property details.

### POST `/api/valuation`
Perform property valuation using created payload.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Check the API documentation in `/api-documentation.md`
- Review the demo pages for usage examples
