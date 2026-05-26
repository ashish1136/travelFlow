import React, { useEffect, useState } from 'react';
import DiscoveryCard from './DiscoveryCard';
import { routeService } from '../services/routeService';
import { hotelImages, restaurantImages } from '../utils/fallbackImages'; 

const RouteSuggestions = ({ sourceLat, sourceLon, destLat, destLon, sourceCity, destCity, onExplore, onRouteFound, onDataLoaded }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      setLoading(true);
      const data = await routeService.getRouteAndStops(sourceLat, sourceLon, destLat, destLon);
      setPlaces(data.suggestedStops || []);
      if (onDataLoaded) onDataLoaded(data.suggestedStops || []);
      if (data.routeGeometry && onRouteFound) {
          onRouteFound(data.routeGeometry);
      }
      setLoading(false);
    };
    if (sourceLat && sourceLon && destLat && destLon) {
        fetchRouteData();
    }
  }, [sourceLat, sourceLon, destLat, destLon]);

  if (loading) return (
      <div className="mt-16 pt-16 border-t border-slate-200">
          <div className="animate-pulse h-10 w-96 bg-slate-200 rounded-xl mb-8"></div>
          <div className="flex overflow-x-auto gap-6">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-80 min-w-[280px] bg-slate-100 rounded-3xl"></div>)}
          </div>
      </div>
  );
  
  const displayPlaces = places.length >= 3 ? places : [
    {
      name: "Brahma Sarovar",
      city: "Kurukshetra",
      description: "An ancient, highly sacred water tank connected to Mahabharata legends.",
      category: "Spiritual Landmark",
      lat: 29.9658,
      lon: 76.8340
    },
    {
      name: "India Gate",
      city: "Delhi",
      description: "The iconic war memorial archway situated in the heart of Rajpath, New Delhi.",
      category: "Historical Monument",
      lat: 28.6129,
      lon: 77.2295
    },
    {
      name: "Krishna Janmabhoomi Temple",
      city: "Mathura",
      description: "The holy temple complex built around the sacred prison birthplace of Lord Krishna.",
      category: "Pilgrimage Site",
      lat: 27.4924,
      lon: 77.6737
    }
  ];

  return (
    <div className="mt-16 pt-16 border-t border-slate-200">
      <h3 className="text-3xl font-black text-slate-900 mb-2">Suggested Stops Along Your Journey</h3>
      <p className="text-slate-500 mb-8 font-medium">Interesting places between {sourceCity || 'your starting point'} and {destCity}.</p>
      <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide">
        {displayPlaces.map((place, idx) => (
          <div key={idx} className="min-w-[280px] max-w-[320px] h-full flex-shrink-0">
            <DiscoveryCard 
              place={place} 
              onExplore={onExplore}
              imageSrc={hotelImages[(idx + 4) % hotelImages.length] || restaurantImages[idx % restaurantImages.length]} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteSuggestions;
