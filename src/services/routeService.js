import axios from './apiClient';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const routeService = {
  getRouteAndStops: async (sourceLat, sourceLon, destLat, destLon) => {
    try {
      // 1. Get Route
      const routeUrl = `https://api.geoapify.com/v1/routing?waypoints=${sourceLat},${sourceLon}|${destLat},${destLon}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
      const routeResponse = await axios.get(routeUrl);
      
      let routeGeometry = null;
      let routePoints = [];
      if (routeResponse.data && routeResponse.data.features && routeResponse.data.features.length > 0) {
        routeGeometry = routeResponse.data.features[0].geometry.coordinates; // Array of line strings or multi-line strings
        // Flatten geometry to get points
        if (routeGeometry.length > 0) {
            const firstLine = routeGeometry[0];
            if (Array.isArray(firstLine) && firstLine.length > 0 && Array.isArray(firstLine[0])) {
                routePoints = firstLine.map(coord => ({ lon: coord[0], lat: coord[1] }));
            }
        }
      }

      // 2. Fetch Places Along the route
      // We will sample a few points along the route (e.g. 3 points) and fetch places around them
      let suggestedStops = [];
      if (routePoints.length > 0) {
          const numSamples = 3;
          const sampleIndices = [];
          for (let i = 1; i <= numSamples; i++) {
              sampleIndices.push(Math.floor((routePoints.length / (numSamples + 1)) * i));
          }

          for (let index of sampleIndices) {
              const point = routePoints[index];
              if (!point) continue;
              const radius = 10000; // 10km radius
              const categories = 'catering.cafe,tourism.attraction,heritage,natural';
              const placesUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${point.lon},${point.lat},${radius}&bias=proximity:${point.lon},${point.lat}&limit=3&apiKey=${GEOAPIFY_KEY}`;
              
              try {
                  const placesRes = await axios.get(placesUrl);
                  if (placesRes.data && placesRes.data.features) {
                      const places = placesRes.data.features
                          .filter(f => f.properties.name && f.geometry.coordinates)
                          .map(f => ({
                              name: f.properties.name,
                              lat: f.geometry.coordinates[1],
                              lon: f.geometry.coordinates[0],
                              distance: f.properties.distance,
                              description: f.properties.formatted,
                              category: f.properties.categories[0]
                          }));
                      
                      for (const p of places) {
                          if (!suggestedStops.find(s => s.name === p.name)) {
                              suggestedStops.push(p);
                          }
                      }
                  }
              } catch (e) {
                  console.error("Error fetching places for route point", e);
              }
          }
      }

      let leafLetPositions = [];
      if (routePoints.length > 0) {
          leafLetPositions = routePoints.map(p => [p.lat, p.lon]);
      }

      return {
          routeGeometry: leafLetPositions.length > 0 ? leafLetPositions : null,
          suggestedStops: suggestedStops
      };

    } catch (error) {
      console.error('Error fetching route and stops:', error);
      return { routeGeometry: null, suggestedStops: [] };
    }
  }
};
