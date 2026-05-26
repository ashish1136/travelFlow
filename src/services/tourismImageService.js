import axios from './apiClient';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export const tourismImageService = {
  /**
   * Fetches a high-quality, highly relevant, real image for a tourist landmark.
   * Order of strategies:
   * 1. Unsplash Search API (if VITE_UNSPLASH_ACCESS_KEY is present)
   * 2. Wikipedia Search API (highly reliable, free, returns real historical/cultural photos of landmarks)
   * 3. Intelligent keyword-based high-quality fallback stock images
   */
  getImageForPlace: async (query) => {
    if (!query) return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80';

    // Strategy 1: Wikipedia Search API (Free, excellent for actual Indian monuments/places)
    try {
      // Search Wikipedia for pages matching the query, requesting thumbnails of size 800px width
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=800&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&origin=*`;
      const response = await axios.get(wikiUrl);
      
      const pages = response.data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;
        if (thumbnail && thumbnail.startsWith('http')) {
          return thumbnail;
        }
      }
    } catch (err) {
      console.warn('Error fetching image from Wikipedia:', err);
    }

    // Strategy 2: Unsplash API
    if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY.trim() !== '') {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=3&orientation=landscape`;
        const response = await axios.get(url);
        if (response.data && response.data.results && response.data.results.length > 0) {
          // Select first matching photo
          return response.data.results[0].urls.regular;
        }
      } catch (err) {
        console.error('Error fetching image from Unsplash:', err);
      }
    }

    // Strategy 3: Intelligent Keyword Fallback Stock Photos (High quality Unsplash images)
    const lowerQuery = query.toLowerCase();

    // Spiritual / Pilgrimage Sites
    if (
      lowerQuery.includes('temple') || 
      lowerQuery.includes('mandir') || 
      lowerQuery.includes('vishwanath') || 
      lowerQuery.includes('pilgrim') || 
      lowerQuery.includes('sahib') ||
      lowerQuery.includes('gurudwara') || 
      lowerQuery.includes('vrindavan') || 
      lowerQuery.includes('mathura') || 
      lowerQuery.includes('kashi')
    ) {
      return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80'; // Iconic Indian Temple/Spiritual sunset
    }

    // River Ghats / Haridwar / Varanasi
    if (
      lowerQuery.includes('ghat') || 
      lowerQuery.includes('ganga') || 
      lowerQuery.includes('haridwar') || 
      lowerQuery.includes('rishikesh') ||
      lowerQuery.includes('river') ||
      lowerQuery.includes('lake')
    ) {
      return 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=800&q=80'; // Haridwar/Varanasi River Ghat
    }

    // Monuments / Gates / Historical Landmarks
    if (
      lowerQuery.includes('gate') || 
      lowerQuery.includes('fort') || 
      lowerQuery.includes('palace') || 
      lowerQuery.includes('taj') || 
      lowerQuery.includes('mahal') || 
      lowerQuery.includes('monument') ||
      lowerQuery.includes('red fort') ||
      lowerQuery.includes('delhi gate')
    ) {
      return 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80'; // India Gate/Delhi Heritage monument
    }

    // Hills / Mountains / Nature
    if (
      lowerQuery.includes('hill') || 
      lowerQuery.includes('mountain') || 
      lowerQuery.includes('shimla') || 
      lowerQuery.includes('kasauli') || 
      lowerQuery.includes('morni') ||
      lowerQuery.includes('ridge') ||
      lowerQuery.includes('solan') ||
      lowerQuery.includes('valley')
    ) {
      return 'https://images.unsplash.com/photo-1571893544028-06b07af607eb?auto=format&fit=crop&w=800&q=80'; // Shimla/Kasauli green mountain hills
    }

    // Default Premium India Tourism / Taj Mahal sunset image
    return 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80';
  }
};
