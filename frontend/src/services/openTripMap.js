import axios from './apiClient';

const OTM_API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY || '';
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

// In-memory Map to cache responses to prevent repeated API calls
const imageCache = new Map();

const CURATED_DESTINATIONS = {
  delhi: [
    { id: 'c_del1', name: 'India Gate', lat: 28.6129, lon: 77.2295, address: 'Rajpath, India Gate, New Delhi', categories: ['tourism.sights', 'heritage'], rank: 1, type: 'Monument' },
    { id: 'c_del2', name: 'Red Fort', lat: 28.6562, lon: 77.2410, address: 'Netaji Subhash Marg, Chandni Chowk', categories: ['tourism.sights', 'heritage'], rank: 0.99, type: 'Heritage' },
    { id: 'c_del3', name: 'Qutub Minar', lat: 28.5244, lon: 77.1855, address: 'Mehrauli, New Delhi', categories: ['tourism.sights', 'heritage'], rank: 0.98, type: 'Heritage' },
    { id: 'c_del4', name: 'Lotus Temple', lat: 28.5535, lon: 77.2588, address: 'Kalkaji, New Delhi', categories: ['tourism.sights', 'religion'], rank: 0.97, type: 'Temple' },
    { id: 'c_del5', name: 'Akshardham', lat: 28.6127, lon: 77.2773, address: 'NH 24, Pramukh Swami Maharaj Marg', categories: ['tourism.sights', 'religion'], rank: 0.96, type: 'Temple' },
    { id: 'c_del6', name: 'Humayun Tomb', lat: 28.5933, lon: 77.2507, address: 'Mathura Road, Nizamuddin East', categories: ['tourism.sights', 'heritage'], rank: 0.95, type: 'Heritage' },
    { id: 'c_del7', name: 'Jama Masjid', lat: 28.6507, lon: 77.2334, address: 'Chandni Chowk, New Delhi', categories: ['tourism.sights', 'religion'], rank: 0.94, type: 'Temple' },
    { id: 'c_del8', name: 'Chandni Chowk', lat: 28.6505, lon: 77.2303, address: 'Chandni Chowk, New Delhi', categories: ['tourism.sights', 'heritage'], rank: 0.93, type: 'Market' },
    { id: 'c_del9', name: 'Rashtrapati Bhavan', lat: 28.6143, lon: 77.1994, address: 'President Estate, New Delhi', categories: ['tourism.sights', 'heritage'], rank: 0.92, type: 'Heritage' },
  ],
  mumbai: [
    { id: 'c_mum1', name: 'Gateway of India', lat: 18.9220, lon: 72.8347, address: 'Apollo Bandar, Colaba', categories: ['tourism.sights', 'heritage'], rank: 1, type: 'Heritage' },
    { id: 'c_mum2', name: 'Marine Drive', lat: 18.9440, lon: 72.8227, address: 'Netaji Subhash Chandra Bose Road', categories: ['tourism.sights'], rank: 0.99, type: 'Sightseeing' },
    { id: 'c_mum3', name: 'Siddhivinayak Temple', lat: 19.0169, lon: 72.8304, address: 'Prabhadevi, Mumbai', categories: ['tourism.sights', 'religion'], rank: 0.98, type: 'Temple' },
    { id: 'c_mum4', name: 'Elephanta Caves', lat: 18.9633, lon: 72.9315, address: 'Gharapuri, Maharashtra', categories: ['tourism.sights', 'heritage'], rank: 0.97, type: 'Heritage' },
    { id: 'c_mum5', name: 'Chhatrapati Shivaji Maharaj Terminus', lat: 18.9398, lon: 72.8354, address: 'CSMT, Fort', categories: ['tourism.sights', 'heritage'], rank: 0.96, type: 'Heritage' },
  ],
  jaipur: [
    { id: 'c_jai1', name: 'Amber Fort', lat: 26.9855, lon: 75.8513, address: 'Devisinghpura, Amer', categories: ['tourism.sights', 'heritage'], rank: 1, type: 'Heritage' },
    { id: 'c_jai2', name: 'Jal Mahal', lat: 26.9678, lon: 75.8456, address: 'Amer Road, Jal Mahal', categories: ['tourism.sights', 'heritage'], rank: 0.99, type: 'Heritage' },
    { id: 'c_jai3', name: 'Nahargarh Fort', lat: 26.9372, lon: 75.8155, address: 'Krishna Nagar, Brahampuri', categories: ['tourism.sights', 'heritage'], rank: 0.98, type: 'Heritage' },
    { id: 'c_jai4', name: 'Hawa Mahal', lat: 26.9239, lon: 75.8267, address: 'Badi Choupad, Pink City', categories: ['tourism.sights', 'heritage'], rank: 0.97, type: 'Heritage' },
    { id: 'c_jai5', name: 'City Palace', lat: 26.9255, lon: 75.8236, address: 'Tulsi Marg, Gangori Bazaar', categories: ['tourism.sights', 'heritage'], rank: 0.96, type: 'Heritage' },
    { id: 'c_jai6', name: 'Jantar Mantar', lat: 26.9248, lon: 75.8246, address: 'Gangori Bazaar', categories: ['tourism.sights', 'heritage'], rank: 0.95, type: 'Heritage' },
    { id: 'c_jai7', name: 'Albert Hall Museum', lat: 26.9116, lon: 75.8195, address: 'Ram Niwas Garden', categories: ['tourism.sights', 'museum'], rank: 0.94, type: 'Museum' },
    { id: 'c_jai8', name: 'Birla Mandir', lat: 26.8824, lon: 75.8159, address: 'Tilak Nagar', categories: ['tourism.sights', 'temple'], rank: 0.93, type: 'Temple' },
    { id: 'c_jai9', name: 'Bapu Bazaar', lat: 26.9168, lon: 75.8252, address: 'Bapu Bazaar, Jaipur', categories: ['tourism.sights', 'market'], rank: 0.92, type: 'Market' },
    { id: 'c_jai10', name: 'Sisodia Rani Garden', lat: 26.8974, lon: 75.8642, address: 'Agra Road', categories: ['tourism.sights', 'garden'], rank: 0.91, type: 'Garden' },
    { id: 'c_jai11', name: 'Jaigarh Fort', lat: 26.9781, lon: 75.8464, address: 'Devisinghpura, Amer', categories: ['tourism.sights', 'heritage'], rank: 0.90, type: 'Heritage' },
    { id: 'c_jai12', name: 'Johari Bazaar', lat: 26.9224, lon: 75.8272, address: 'Johari Bazaar Road', categories: ['tourism.sights', 'market'], rank: 0.89, type: 'Market' }
  ],
  agra: [
    { id: 'c_agr1', name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, address: 'Dharmapuri, Forest Colony, Tajganj', categories: ['tourism.sights', 'heritage'], rank: 1, type: 'Heritage' },
    { id: 'c_agr2', name: 'Agra Fort', lat: 27.1795, lon: 78.0211, address: 'Agra Fort, Rakabganj', categories: ['tourism.sights', 'heritage'], rank: 0.99, type: 'Heritage' },
    { id: 'c_agr3', name: 'Fatehpur Sikri', lat: 27.0945, lon: 77.6679, address: 'Fatehpur Sikri', categories: ['tourism.sights', 'heritage'], rank: 0.98, type: 'Heritage' },
  ],
  chandigarh: [
    { id: 'c_chd1', name: 'Rock Garden', lat: 30.7525, lon: 76.8066, address: 'Sector 1, Chandigarh', categories: ['tourism.sights', 'amusements'], rank: 1, type: 'Attraction' },
    { id: 'c_chd2', name: 'Sukhna Lake', lat: 30.7421, lon: 76.8188, address: 'Sector 1, Chandigarh', categories: ['tourism.sights', 'natural'], rank: 0.99, type: 'Attraction' },
    { id: 'c_chd3', name: 'Rose Garden', lat: 30.7460, lon: 76.7820, address: 'Sector 16, Chandigarh', categories: ['tourism.sights', 'garden'], rank: 0.98, type: 'Garden' },
    { id: 'c_chd4', name: 'Capitol Complex', lat: 30.7583, lon: 76.8028, address: 'Sector 1, Chandigarh', categories: ['tourism.sights', 'heritage'], rank: 0.97, type: 'Heritage' },
    { id: 'c_chd5', name: 'Government Museum', lat: 30.7483, lon: 76.7865, address: 'Sector 10, Chandigarh', categories: ['tourism.sights', 'museum'], rank: 0.96, type: 'Museum' },
    { id: 'c_chd6', name: 'Elante Mall', lat: 30.7055, lon: 76.8013, address: 'Industrial Area Phase I', categories: ['malls', 'shops'], rank: 0.95, type: 'Mall' },
    { id: 'c_chd7', name: 'ISKCON Temple', lat: 30.7302, lon: 76.7629, address: 'Sector 36B, Chandigarh', categories: ['tourism.sights', 'religion'], rank: 0.94, type: 'Temple' },
    { id: 'c_chd8', name: 'Le Corbusier Centre', lat: 30.7289, lon: 76.8000, address: 'Sector 19B, Chandigarh', categories: ['tourism.sights', 'museum'], rank: 0.93, type: 'Museum' },
    { id: 'c_chd9', name: 'Garden of Fragrance', lat: 30.7305, lon: 76.7562, address: 'Sector 36, Chandigarh', categories: ['tourism.sights', 'garden'], rank: 0.92, type: 'Garden' },
    { id: 'c_chd10', name: 'Sector 17 Market', lat: 30.7398, lon: 76.7827, address: 'Sector 17, Chandigarh', categories: ['shops', 'market'], rank: 0.91, type: 'Market' },
    { id: 'c_chd11', name: 'Japanese Garden', lat: 30.7107, lon: 76.7818, address: 'Sector 31A, Chandigarh', categories: ['tourism.sights', 'garden'], rank: 0.90, type: 'Garden' },
    { id: 'c_chd12', name: 'Terraced Garden', lat: 30.7165, lon: 76.7645, address: 'Sector 33, Chandigarh', categories: ['tourism.sights', 'garden'], rank: 0.89, type: 'Garden' }
  ],
  kota: [
    { id: 'c_kot1', name: 'Seven Wonders Park', lat: 25.1764, lon: 75.8340, address: 'Vallabh Nagar, Kota', categories: ['tourism.sights', 'amusements'], rank: 1, type: 'Park' },
    { id: 'c_kot2', name: 'Garh Palace', lat: 25.1751, lon: 75.8273, address: 'Tipta, Kota', categories: ['tourism.sights', 'heritage'], rank: 0.99, type: 'Heritage' },
    { id: 'c_kot3', name: 'Kishore Sagar', lat: 25.1760, lon: 75.8360, address: 'Kishore Sagar, Kota', categories: ['tourism.sights', 'natural'], rank: 0.98, type: 'Attraction' },
    { id: 'c_kot4', name: 'Jagmandir Palace', lat: 25.1755, lon: 75.8375, address: 'Middle of Kishore Sagar', categories: ['tourism.sights', 'heritage'], rank: 0.97, type: 'Heritage' },
    { id: 'c_kot5', name: 'City Mall', lat: 25.1432, lon: 75.8450, address: 'Jhalawar Road, Kota', categories: ['malls', 'shops'], rank: 0.96, type: 'Mall' },
    { id: 'c_kot6', name: 'Godavari Dham Temple', lat: 25.1455, lon: 75.8115, address: 'Dadabari, Kota', categories: ['tourism.sights', 'religion'], rank: 0.95, type: 'Temple' },
    { id: 'c_kot7', name: 'Chambal Gardens', lat: 25.1480, lon: 75.8175, address: 'Amar Niwas, Kota', categories: ['tourism.sights', 'garden'], rank: 0.94, type: 'Garden' },
    { id: 'c_kot8', name: 'Kota Barrage', lat: 25.1812, lon: 75.8177, address: 'Chambal River, Kota', categories: ['tourism.sights', 'heritage'], rank: 0.93, type: 'Attraction' },
    { id: 'c_kot9', name: 'Abheda Mahal', lat: 25.2010, lon: 75.8010, address: 'Nanta Road, Kota', categories: ['tourism.sights', 'heritage'], rank: 0.92, type: 'Heritage' },
    { id: 'c_kot10', name: 'Kansua Temple', lat: 25.1485, lon: 75.8770, address: 'Kansua, Kota', categories: ['tourism.sights', 'religion'], rank: 0.91, type: 'Temple' },
    { id: 'c_kot11', name: 'Darrah Wildlife Sanctuary', lat: 24.8110, lon: 75.9860, address: 'Kota District', categories: ['tourism.sights', 'natural'], rank: 0.90, type: 'Attraction' },
    { id: 'c_kot12', name: 'Khade Ganesh Ji Temple', lat: 25.1115, lon: 75.8110, address: 'Kota', categories: ['tourism.sights', 'religion'], rank: 0.89, type: 'Temple' }
  ],
  varanasi: [
    { id: 'c_var1', name: 'Kashi Vishwanath Temple', lat: 25.3109, lon: 83.0107, address: 'Lahori Tola, Varanasi', categories: ['tourism.sights', 'religion'], rank: 1, type: 'Temple' },
    { id: 'c_var2', name: 'Dashashwamedh Ghat', lat: 25.3072, lon: 83.0105, address: 'Dashashwamedh Ghat Road', categories: ['tourism.sights', 'heritage'], rank: 0.99, type: 'Heritage' },
    { id: 'c_var3', name: 'Sarnath', lat: 25.3811, lon: 83.0246, address: 'Sarnath, Varanasi', categories: ['tourism.sights', 'heritage'], rank: 0.98, type: 'Heritage' },
    { id: 'c_var4', name: 'Assi Ghat', lat: 25.2891, lon: 83.0044, address: 'Assi Ghat, Varanasi', categories: ['tourism.sights', 'heritage'], rank: 0.97, type: 'Heritage' },
    { id: 'c_var5', name: 'Ramnagar Fort', lat: 25.2703, lon: 83.0253, address: 'Ramnagar, Varanasi', categories: ['tourism.sights', 'heritage'], rank: 0.96, type: 'Heritage' },
    { id: 'c_var6', name: 'Sankat Mochan Hanuman Temple', lat: 25.2828, lon: 82.9984, address: 'Sankat Mochan Road', categories: ['tourism.sights', 'religion'], rank: 0.95, type: 'Temple' },
    { id: 'c_var7', name: 'Tulsi Manas Temple', lat: 25.2858, lon: 83.0004, address: 'Sankat Mochan Road', categories: ['tourism.sights', 'religion'], rank: 0.94, type: 'Temple' },
    { id: 'c_var8', name: 'JHV Mall', lat: 25.3340, lon: 82.9780, address: 'Cantonment, Varanasi', categories: ['malls', 'shops'], rank: 0.93, type: 'Mall' },
    { id: 'c_var9', name: 'Manikarnika Ghat', lat: 25.3117, lon: 83.0132, address: 'Manikarnika Ghat', categories: ['tourism.sights', 'heritage'], rank: 0.92, type: 'Heritage' },
    { id: 'c_var10', name: 'New Vishwanath Temple (BHU)', lat: 25.2655, lon: 82.9896, address: 'Banaras Hindu University', categories: ['tourism.sights', 'religion'], rank: 0.91, type: 'Temple' },
    { id: 'c_var11', name: 'Durga Temple', lat: 25.2866, lon: 83.0003, address: 'Durga Kund', categories: ['tourism.sights', 'religion'], rank: 0.90, type: 'Temple' },
    { id: 'c_var12', name: 'Bharat Mata Temple', lat: 25.3175, lon: 82.9892, address: 'Mahatma Gandhi Kashi Vidyapith', categories: ['tourism.sights', 'religion'], rank: 0.89, type: 'Temple' }
  ]
};

export const openTripMapService = {
  async geocode(cityName) {
    if (!OTM_API_KEY) throw new Error('OpenTripMap API Key missing');
    try {
      const response = await axios.get(`${BASE_URL}/geoname`, {
        params: { name: cityName, apikey: OTM_API_KEY },
      });
      if (response.data && response.data.lat && response.data.lon) {
        return { 
          lat: response.data.lat, 
          lon: response.data.lon, 
          city: response.data.name,
          rank: 0.9 // Placeholder
        };
      }
      throw new Error('City not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  async getAutocomplete(text) {
    if (!text || text.length < 3 || !OTM_API_KEY) return [];
    try {
      const response = await axios.get(`${BASE_URL}/geoname`, {
        params: { name: text, apikey: OTM_API_KEY },
      });
      if (response.data && response.data.lat && response.data.lon) {
        return [{
          label: `${response.data.name}${response.data.country ? `, ${response.data.country}` : ''}`,
          city: response.data.name,
          lat: response.data.lat,
          lon: response.data.lon,
        }];
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getAttractions(lat, lon, cityName = '', limit = 150) {
    if (!OTM_API_KEY) throw new Error('OpenTripMap API Key missing');
    try {
      const response = await axios.get(`${BASE_URL}/radius`, {
        params: {
          radius: 35000,
          lon,
          lat,
          kinds: 'historic,architecture,cultural,natural,amusements,religion,malls,marketplaces,shops,tourist_facilities',
          rate: 2,
          format: 'json',
          limit: 300,
          apikey: OTM_API_KEY,
        },
      });

      let fetched = (response.data || [])
        .map(f => {
          return {
            id: f.xid,
            xid: f.xid,
            name: f.name,
            lat: f.point.lat,
            lon: f.point.lon,
            address: '',
            categories: f.kinds ? f.kinds.split(',') : [],
            rank: f.rate || 0,
            type: f.kinds ? f.kinds.split(',')[0] : 'Attraction', 
          };
        })
        .filter(a => a.name && a.name.length > 4 && !a.name.toLowerCase().includes('police') && !a.name.toLowerCase().includes('gate no'))
        .filter(a => !(a.categories.includes('religion') && a.rank < 3)); // Filter out small/non-famous religious spots
        
      // Deduplicate
      const deduplicated = [];
      const seenNames = new Set();
      for (const place of fetched) {
         const normName = place.name.toLowerCase().replace(/[^a-z0-9]/g, '');
         if (seenNames.has(normName)) continue;
         seenNames.add(normName);
         deduplicated.push(place);
      }
      fetched = deduplicated;

      // Inject Curated lists 
      const cid = cityName.toLowerCase();
      let curated = [];
      if (CURATED_DESTINATIONS[cid]) {
          curated = CURATED_DESTINATIONS[cid];
      } else {
         const match = Object.keys(CURATED_DESTINATIONS).find(k => cid.includes(k));
         if (match) curated = CURATED_DESTINATIONS[match];
      }

      const curatedNamesSet = new Set(curated.map(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
      fetched = fetched.filter(f => !curatedNamesSet.has(f.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
      
      const mixed = [...curated, ...fetched];
      return mixed.sort((a, b) => (b.rank || 0) - (a.rank || 0));
      
    } catch (error) {
      console.error('Places error:', error);
      throw error;
    }
  },

  async getHotels(lat, lon, limit = 20, radius = 25000) {
    if (!OTM_API_KEY) throw new Error('OpenTripMap API Key missing');
    try {
      const response = await axios.get(`${BASE_URL}/radius`, {
        params: {
          radius,
          lon,
          lat,
          kinds: 'accomodations',
          format: 'json',
          limit,
          apikey: OTM_API_KEY,
        },
      });

      return (response.data || [])
        .map(f => ({
          id: f.xid,
          xid: f.xid,
          name: f.name,
          lat: f.point.lat,
          lon: f.point.lon,
          address: '',
          rank: f.rate || 0,
          type: 'Hotel',
        }))
        .filter(a => a.name && a.name.length > 2)
        .sort((a, b) => (b.rank || 0) - (a.rank || 0));
    } catch (error) {
      console.error('Hotels error:', error);
      return [];
    }
  },

  async getRestaurants(lat, lon, limit = 20, radius = 25000) {
    if (!OTM_API_KEY) throw new Error('OpenTripMap API Key missing');
    try {
      const response = await axios.get(`${BASE_URL}/radius`, {
        params: {
          radius,
          lon,
          lat,
          kinds: 'foods',
          format: 'json',
          limit,
          apikey: OTM_API_KEY,
        },
      });

      return (response.data || [])
        .map(f => ({
          id: f.xid,
          xid: f.xid,
          name: f.name,
          lat: f.point.lat,
          lon: f.point.lon,
          address: '',
          rank: f.rate || 0,
          type: 'Restaurant',
          categories: f.kinds ? f.kinds.split(',') : [],
        }))
        .filter(a => a.name && a.name.length > 2 && a.lat && a.lon)
        .sort((a, b) => (b.rank || 0) - (a.rank || 0));
    } catch (error) {
      console.error('Restaurants error:', error);
      return [];
    }
  },

  async getPlaceDetails(xid) {
    if (imageCache.has(xid)) {
      return imageCache.get(xid);
    }
    
    if (!OTM_API_KEY || !xid) {
        const fallback = { xid, image: null, description: 'Location details API key missing.' };
        imageCache.set(xid, fallback);
        return fallback;
    }

    try {
      const response = await axios.get(`${BASE_URL}/xid/${xid}`, {
        params: { apikey: OTM_API_KEY }
      });
      
      const data = response.data;
      const details = {
          xid: data.xid,
          name: data.name,
          image: null,
          description: data.wikipedia_extracts?.text || data.info?.descr || 'No description available for this location.',
          url: data.url || data.wikipedia || null
      };

      imageCache.set(xid, details);
      return details;
    } catch (error) {
      console.warn(`Failed to fetch OpenTripMap details for xid: ${xid}`, error);
      const failedDetails = { xid, image: null, description: 'Details currently unavailable.' };
      imageCache.set(xid, failedDetails);
      return failedDetails;
    }
  }
};
