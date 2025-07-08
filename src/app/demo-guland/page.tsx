'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { gulandApiClient } from '@/lib/guland-api-client';

export default function GulandDemoPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:8000');
  
  // Form states
  const [planningData, setPlanningData] = useState({
    marker_lat: 10.779783071564157,
    marker_lng: 106.69747857570651,
    province_id: 79
  });

  const [geocodingData, setGeocodingData] = useState({
    lat: 21.0277644,
    lng: 105.8341598,
    path: 'soi-quy-hoach/ha-noi'
  });

  const [checkPlanData, setCheckPlanData] = useState({
    lat: 21.027694382795676,
    lng: 105.83994358778001,
    lat_ne: 21.028653255803814,
    lng_ne: 105.84077775478364,
    lat_sw: 21.02637247986612,
    lng_sw: 105.83562791347505,
    province_id: '01',
    map: 1,
    is_check_plan: 1
  });

  const [roadPointsData, setRoadPointsData] = useState({
    lat: 21.027694382795676,
    lng: 105.83994358778001,
    lat_ne: 21.028653255803814,
    lng_ne: 105.84077775478364,
    lat_sw: 21.02637247986612,
    lng_sw: 105.83562791347505
  });

  const handleApiCall = async (apiFunction: () => Promise<any>, description: string) => {
    setLoading(true);
    setResults(null);
    
    try {
      console.log(`🚀 Testing: ${description}`);
      const result = await apiFunction();
      
      setResults({
        success: true,
        description,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setResults({
        success: false,
        description,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = () => {
    handleApiCall(
      () => gulandApiClient.healthCheck(),
      'Health Check'
    );
  };

  const testPlanningData = () => {
    handleApiCall(
      () => gulandApiClient.getPlanningData(planningData),
      'Get Planning Data'
    );
  };

  const testGeocoding = () => {
    handleApiCall(
      () => gulandApiClient.geocoding(geocodingData),
      'Geocoding (GET)'
    );
  };

  const testGeocodingPost = () => {
    handleApiCall(
      () => gulandApiClient.geocodingPost(geocodingData),
      'Geocoding (POST)'
    );
  };

  const testRefreshToken = () => {
    handleApiCall(
      () => gulandApiClient.refreshToken(),
      'Refresh CSRF Token'
    );
  };

  const testCheckPlan = () => {
    handleApiCall(
      () => gulandApiClient.checkPlan(checkPlanData),
      'Check Plan'
    );
  };

  const testRoadPoints = () => {
    handleApiCall(
      () => gulandApiClient.getRoadPoints(roadPointsData),
      'Get Road Points'
    );
  };

  // Test using NextJS proxy endpoints
  const testProxyPlanningData = () => {
    handleApiCall(
      async () => {
        const response = await fetch('/api/guland-proxy/planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planningData)
        });
        return response.json();
      },
      'Planning Data (via NextJS Proxy)'
    );
  };

  const testProxyGeocoding = () => {
    handleApiCall(
      async () => {
        const params = new URLSearchParams({
          lat: geocodingData.lat.toString(),
          lng: geocodingData.lng.toString(),
          path: geocodingData.path
        });
        const response = await fetch(`/api/guland-proxy/geocoding?${params}`);
        return response.json();
      },
      'Geocoding (via NextJS Proxy)'
    );
  };

  const testProxyHealth = () => {
    handleApiCall(
      async () => {
        const response = await fetch('/api/guland-proxy/health');
        return response.json();
      },
      'Health Check (via NextJS Proxy)'
    );
  };

  const testProxyCheckPlan = () => {
    handleApiCall(
      async () => {
        const params = new URLSearchParams({
          lat: checkPlanData.lat.toString(),
          lng: checkPlanData.lng.toString(),
          lat_ne: checkPlanData.lat_ne.toString(),
          lng_ne: checkPlanData.lng_ne.toString(),
          lat_sw: checkPlanData.lat_sw.toString(),
          lng_sw: checkPlanData.lng_sw.toString(),
          province_id: checkPlanData.province_id,
          map: checkPlanData.map.toString(),
          is_check_plan: checkPlanData.is_check_plan.toString()
        });
        const response = await fetch(`/api/guland-proxy/check-plan?${params}`);
        return response.json();
      },
      'Check Plan (via NextJS Proxy)'
    );
  };

  const testProxyRoadPoints = () => {
    handleApiCall(
      async () => {
        const params = new URLSearchParams({
          lat: roadPointsData.lat.toString(),
          lng: roadPointsData.lng.toString(),
          lat_ne: roadPointsData.lat_ne.toString(),
          lng_ne: roadPointsData.lng_ne.toString(),
          lat_sw: roadPointsData.lat_sw.toString(),
          lng_sw: roadPointsData.lng_sw.toString()
        });
        const response = await fetch(`/api/guland-proxy/road-points?${params}`);
        return response.json();
      },
      'Road Points (via NextJS Proxy)'
    );
  };

  const testProxyRefreshToken = () => {
    handleApiCall(
      async () => {
        const response = await fetch('/api/guland-proxy/refresh-token', {
          method: 'POST'
        });
        return response.json();
      },
      'Refresh Token (via NextJS Proxy)'
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Guland API Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test Guland FastAPI server and NextJS proxy endpoints
        </p>
      </div>

      {/* Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>Configure your Guland FastAPI server URL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serverUrl">FastAPI Server URL</Label>
              <Input
                id="serverUrl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Make sure your FastAPI server is running on the specified URL
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planning Data Form */}
        <Card>
          <CardHeader>
            <CardTitle>Planning Data</CardTitle>
            <CardDescription>Get planning data for coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={planningData.marker_lat}
                onChange={(e) => setPlanningData({...planningData, marker_lat: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={planningData.marker_lng}
                onChange={(e) => setPlanningData({...planningData, marker_lng: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="province">Province ID</Label>
              <Input
                id="province"
                type="number"
                value={planningData.province_id}
                onChange={(e) => setPlanningData({...planningData, province_id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Button onClick={testPlanningData} disabled={loading} className="w-full">
                Test Direct API
              </Button>
              <Button onClick={testProxyPlanningData} disabled={loading} variant="outline" className="w-full">
                Test via NextJS Proxy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Geocoding Form */}
        <Card>
          <CardHeader>
            <CardTitle>Geocoding</CardTitle>
            <CardDescription>Get geocoding data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="geo-lat">Latitude</Label>
              <Input
                id="geo-lat"
                type="number"
                step="any"
                value={geocodingData.lat}
                onChange={(e) => setGeocodingData({...geocodingData, lat: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="geo-lng">Longitude</Label>
              <Input
                id="geo-lng"
                type="number"
                step="any"
                value={geocodingData.lng}
                onChange={(e) => setGeocodingData({...geocodingData, lng: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="geo-path">Path</Label>
              <Input
                id="geo-path"
                value={geocodingData.path}
                onChange={(e) => setGeocodingData({...geocodingData, path: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Button onClick={testGeocoding} disabled={loading} className="w-full">
                Test GET Method
              </Button>
              <Button onClick={testGeocodingPost} disabled={loading} variant="outline" className="w-full">
                Test POST Method
              </Button>
              <Button onClick={testProxyGeocoding} disabled={loading} variant="outline" className="w-full">
                Test via NextJS Proxy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional API Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check Plan Form */}
        <Card>
          <CardHeader>
            <CardTitle>Check Plan</CardTitle>
            <CardDescription>Check planning data for area bounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="check-lat">Center Lat</Label>
                <Input
                  id="check-lat"
                  type="number"
                  step="any"
                  value={checkPlanData.lat}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lat: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="check-lng">Center Lng</Label>
                <Input
                  id="check-lng"
                  type="number"
                  step="any"
                  value={checkPlanData.lng}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lng: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="check-lat-ne">NE Lat</Label>
                <Input
                  id="check-lat-ne"
                  type="number"
                  step="any"
                  value={checkPlanData.lat_ne}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lat_ne: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="check-lng-ne">NE Lng</Label>
                <Input
                  id="check-lng-ne"
                  type="number"
                  step="any"
                  value={checkPlanData.lng_ne}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lng_ne: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="check-lat-sw">SW Lat</Label>
                <Input
                  id="check-lat-sw"
                  type="number"
                  step="any"
                  value={checkPlanData.lat_sw}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lat_sw: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="check-lng-sw">SW Lng</Label>
                <Input
                  id="check-lng-sw"
                  type="number"
                  step="any"
                  value={checkPlanData.lng_sw}
                  onChange={(e) => setCheckPlanData({...checkPlanData, lng_sw: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={testCheckPlan} disabled={loading} className="w-full">
                Test Direct API
              </Button>
              <Button onClick={testProxyCheckPlan} disabled={loading} variant="outline" className="w-full">
                Test via NextJS Proxy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Road Points Form */}
        <Card>
          <CardHeader>
            <CardTitle>Road Points</CardTitle>
            <CardDescription>Get road points for area bounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="road-lat">Center Lat</Label>
                <Input
                  id="road-lat"
                  type="number"
                  step="any"
                  value={roadPointsData.lat}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lat: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="road-lng">Center Lng</Label>
                <Input
                  id="road-lng"
                  type="number"
                  step="any"
                  value={roadPointsData.lng}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lng: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="road-lat-ne">NE Lat</Label>
                <Input
                  id="road-lat-ne"
                  type="number"
                  step="any"
                  value={roadPointsData.lat_ne}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lat_ne: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="road-lng-ne">NE Lng</Label>
                <Input
                  id="road-lng-ne"
                  type="number"
                  step="any"
                  value={roadPointsData.lng_ne}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lng_ne: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="road-lat-sw">SW Lat</Label>
                <Input
                  id="road-lat-sw"
                  type="number"
                  step="any"
                  value={roadPointsData.lat_sw}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lat_sw: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="road-lng-sw">SW Lng</Label>
                <Input
                  id="road-lng-sw"
                  type="number"
                  step="any"
                  value={roadPointsData.lng_sw}
                  onChange={(e) => setRoadPointsData({...roadPointsData, lng_sw: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={testRoadPoints} disabled={loading} className="w-full">
                Test Direct API
              </Button>
              <Button onClick={testProxyRoadPoints} disabled={loading} variant="outline" className="w-full">
                Test via NextJS Proxy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>Test various endpoints quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testHealthCheck} disabled={loading} variant="outline">
              Health Check
            </Button>
            <Button onClick={testProxyHealth} disabled={loading} variant="outline">
              Health Check (Proxy)
            </Button>
            <Button onClick={testRefreshToken} disabled={loading} variant="outline">
              Refresh Token
            </Button>
            <Button onClick={testProxyRefreshToken} disabled={loading} variant="outline">
              Refresh Token (Proxy)
            </Button>
            <Button onClick={testCheckPlan} disabled={loading} variant="outline">
              Check Plan
            </Button>
            <Button onClick={testRoadPoints} disabled={loading} variant="outline">
              Road Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Results
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "Success" : "Error"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {results.description} - {results.timestamp}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={JSON.stringify(results.data || results.error, null, 2)}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        </div>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Available endpoints and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Direct API Client Usage:</h4>
            <pre className="bg-muted p-4 rounded text-sm mt-2 overflow-x-auto">
{`import { gulandApiClient } from '@/lib/guland-api-client';

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
});`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">NextJS Proxy Endpoints:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li><code>/api/guland-proxy/health</code> - Health check (GET)</li>
              <li><code>/api/guland-proxy/planning</code> - Planning data (POST)</li>
              <li><code>/api/guland-proxy/geocoding</code> - Geocoding (GET/POST)</li>
              <li><code>/api/guland-proxy/check-plan</code> - Check planning data (GET)</li>
              <li><code>/api/guland-proxy/road-points</code> - Road points data (GET)</li>
              <li><code>/api/guland-proxy/refresh-token</code> - Refresh CSRF token (POST)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 