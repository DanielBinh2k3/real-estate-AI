# Real Estate Valuation API Documentation

This Next.js backend provides 4 API endpoints to perform real estate valuation using Resta.vn APIs.

## Endpoints

### 1. Complete Flow (Recommended for simple usage)

**POST** `/api/complete-flow`

Performs the entire flow from coordinates to valuation in one API call.

**Request Body:**
```json
{
  "latitude": 21.0282993,
  "longitude": 105.8539963,
  "auth_token": "eyJhbGciOiJSUzI1NiJ9...",
        "property_details": {
     "type": "town_house",
     "landArea": 60.0,
     "houseArea": 55.0,
     "bedRoom": 3,
     "bathRoom": 2,
     "legal": "pink_book"
   }
}
```

**Response:**
```json
{
  "input_coordinates": [21.0282993, 105.8539963],
  "location_info": { ... },
  "parsed_address": {
    "city": "ha_noi",
    "district": "hoan_kiem", 
    "ward": "ly_thai_to",
    "formatted_address": "..."
  },
  "valuation_payload": { ... },
  "valuation_result": { ... },
  "distance_analysis": {
    "distances": {
      "toCityCenter": { "distance": 1.2, "name": "Hà Nội" },
      "toDistrictCenter": { "distance": 0.5, "name": "Quận Hoàn Kiếm" }
    },
    "analysis": {
      "accessibility": "excellent",
      "locationAdvantage": "Vị trí trung tâm quận, thuận tiện di chuyển và sinh hoạt",
      "marketImpact": "Giá trị bất động sản cao, thanh khoản tốt"
    }
  },
  "success": true,
  "error": null
}
```

### 2. Get Location from Coordinates

**GET** `/api/location?latitude={lat}&longitude={lng}`

Gets location information from coordinates.

**Parameters:**
- `latitude`: number (required)
- `longitude`: number (required)

**Response:**
```json
{
  "success": true,
  "location_info": { ... },
  "parsed_address": {
    "city": "ha_noi",
    "district": "hoan_kiem",
    "ward": "ly_thai_to",
    "coordinates": [105.8539963, 21.0282993],
    "formatted_address": "...",
    "polygon": [...],
    "bounding_box": [...]
  }
}
```

### 3. Create Valuation Payload

**POST** `/api/create-payload`

Creates a valuation payload from address info and property details.

**Request Body:**
```json
{
  "address_info": {
    "city": "ha_noi",
    "district": "hoan_kiem",
    "ward": "ly_thai_to",
    "coordinates": [105.8539963, 21.0282993]
  },
     "property_details": {
     "type": "house",
     "landArea": 45.0,
     "houseArea": 45.0,
     "bedRoom": 2,
     "bathRoom": 2,
     "legal": "pink_book"
   }
}
```

**Response:**
```json
 {
   "success": true,
   "payload": {
     "type": "house",
    "transId": 1234567890,
    "geoLocation": [105.8539963, 21.0282993],
    "address": {
      "city": "ha_noi",
      "district": "hoan_kiem",
      "ward": "ly_thai_to",
      "addressCode": null
    },
    "landArea": 45.0,
    "houseArea": 45.0,
    "bedRoom": 2,
    "bathRoom": 2,
    "legal": "pink_book"
  }
}
```

### 4. Perform Property Valuation

**POST** `/api/valuation`

Performs the actual property valuation using Resta.vn API.

**Request Body:**
```json
 {
   "payload": {
     "type": "house",
    "transId": 1234567890,
    "geoLocation": [105.8539963, 21.0282993],
    "address": { ... },
    "landArea": 45.0,
    "houseArea": 45.0,
    "bedRoom": 2,
    "bathRoom": 2,
    "legal": "pink_book"
  },
  "auth_token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "valuation_result": {
    // Valuation result from Resta.vn API
  }
}
```

## Property Details Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | "town_house" | Property type (town_house, apartment, villa, house) |
| `landArea` | number | 45.0 | Land area in m² |
| `houseArea` | number | 45.0 | House area in m² |
| `laneWidth` | number | 10.0 | Lane width in meters |
| `facadeWidth` | number | 4.0 | Facade width in meters |
| `storyNumber` | number | 3.0 | Number of stories |
| `bedRoom` | number | 2 | Number of bedrooms |
| `bathRoom` | number | 2 | Number of bathrooms |
| `legal` | string | "pink_book" | Legal status |
| `utilities` | any | undefined | Utilities information |
| `strengths` | any | undefined | Property strengths |
| `weaknesses` | any | undefined | Property weaknesses |

## New Features

### Distance Analysis

The `/api/complete-flow` endpoint now includes **distance analysis** that calculates distances to administrative centers:

**Distance Data:**
- `toCityCenter`: Distance to city/province center
- `toDistrictCenter`: Distance to district center

**Analysis Metrics:**
- `accessibility`: Rating (excellent/good/fair/poor) based on distance to district center
  - `excellent`: ≤ 2km to district center
  - `good`: 2-5km to district center  
  - `fair`: 5-10km to district center
  - `poor`: > 10km to district center
- `locationAdvantage`: Vietnamese description of location benefits
- `marketImpact`: Real estate market impact assessment

**Supported Locations:**
- All 63 provinces and cities in Vietnam
- Districts and administrative subdivisions

## Demo Pages

- Visit `/demo-api` to test the APIs with a user-friendly interface
- Visit `/demo-distance` to test the distance analysis feature specifically

## Example Usage

### Simple Flow (Recommended)
```javascript
const response = await fetch('/api/complete-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 21.0282993,
    longitude: 105.8539963,
    auth_token: 'your_bearer_token',
         property_details: {
       type: 'house',
       landArea: 60,
       houseArea: 55,
       bedRoom: 3,
       bathRoom: 2
     }
  })
});

const result = await response.json();
console.log(result.valuation_result);
```

### Step-by-step Flow
```javascript
// 1. Get location
const locationResponse = await fetch('/api/location?latitude=21.0282993&longitude=105.8539963');
const locationData = await locationResponse.json();

// 2. Create payload  
const payloadResponse = await fetch('/api/create-payload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address_info: locationData.parsed_address,
         property_details: { type: 'house', bedRoom: 3 }
  })
});
const payloadData = await payloadResponse.json();

// 3. Perform valuation
const valuationResponse = await fetch('/api/valuation', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payload: payloadData.payload,
    auth_token: 'your_bearer_token'
  })
});
const valuationResult = await valuationResponse.json();
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message description",
  "success": false
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required parameters)
- `404`: Not Found (no location data found)
- `500`: Internal Server Error (API failure or network issues) 