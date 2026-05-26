import axios from './apiClient';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const BASE_URL = 'https://api.openrouteservice.org/v2';

export const orsService = {
  /**
   * Get route and distance between coordinates
   * points: Array of [lon, lat]
   */
  async getDirections(points) {
    try {
      const response = await axios.post(`${BASE_URL}/directions/driving-car`, {
        coordinates: points,
      }, {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const route = response.data.routes[0];
      return {
        distance: route.summary.distance / 1000, // km
        duration: route.summary.duration / 60, // minutes
        geometry: route.geometry, // polyline coordinates
      };
    } catch (error) {
      console.error('ORS error:', error);
      // Return a basic straight line if routing fails (as fallback)
      return {
        distance: 0,
        duration: 0,
        geometry: null,
      };
    }
  }
};
