import axios from './apiClient';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const nearbyPlacesService = {
  getTopAttractions: async (lat, lon) => {
    try {
      // Radius for destination city (e.g., 20km)
      const radius = 20000;
      const categories = 'tourism.attraction,entertainment,heritage,historic,cultural';
      // filter by popularity if available or limit
      const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=20&apiKey=${GEOAPIFY_KEY}`;
      const response = await axios.get(url);
      if (response.data && response.data.features) {
        let places = response.data.features
            .filter(f => f.properties.name && f.geometry.coordinates)
            .map(f => ({
                name: f.properties.name,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                distance: f.properties.distance,
                description: f.properties.formatted || f.properties.categories.join(', '),
                category: f.properties.categories[0]
            }));
            
        // Filter out duplicates and take top 3
        const uniquePlaces = [];
        const seenNames = new Set();
        for (const place of places) {
            if (!seenNames.has(place.name)) {
                seenNames.add(place.name);
                uniquePlaces.push(place);
            }
            if (uniquePlaces.length === 3) break;
        }
        return uniquePlaces;
      }
      return [];
    } catch (error) {
      console.error('Error fetching top attractions:', error);
      return [];
    }
  },

  getPopularPlacesNearDestination: async (lat, lon) => {
    try {
      const radius = 150000; // 150km
      const categories = 'tourism,entertainment,natural,heritage';
      const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&bias=proximity:${lon},${lat}&limit=50&apiKey=${GEOAPIFY_KEY}`;
      const response = await axios.get(url);
      if (response.data && response.data.features) {
         let places = response.data.features
            .filter(f => f.properties.name && f.geometry.coordinates && f.properties.distance > 20000) // Filter out places that are too close (already in destination)
            .map(f => ({
                name: f.properties.name,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                distance: f.properties.distance,
                description: f.properties.formatted,
                category: f.properties.categories[0]
            }));

         // Sort by popularity/importance or just take diverse ones
         const uniquePlaces = [];
         const seenNames = new Set();
         for (const place of places) {
             if (!seenNames.has(place.name)) {
                 seenNames.add(place.name);
                 uniquePlaces.push(place);
             }
         }
         return uniquePlaces;
      }
      return [];
    } catch (error) {
      console.error('Error fetching popular places near destination:', error);
      return [];
    }
  }
};
