import axios from './apiClient';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const BASE_URL = 'https://api.geoapify.com/v1/geocode/search';

export const locationService = {
  getCoordinates: async (cityName) => {
    try {
      const response = await axios.get(`${BASE_URL}?text=${encodeURIComponent(cityName)}&apiKey=${GEOAPIFY_KEY}&format=json`);
      if (response.data && response.data.results && response.data.results.length > 0) {
        const bestMatch = response.data.results[0];
        return {
          lat: bestMatch.lat,
          lon: bestMatch.lon,
          formatted: bestMatch.formatted
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  },

  validateCity: async (cityName) => {
    if (!cityName || cityName.trim() === '') return false;
    const coords = await locationService.getCoordinates(cityName);
    return coords !== null;
  }
};
