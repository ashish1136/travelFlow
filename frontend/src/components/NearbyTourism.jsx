import React, { useEffect, useState } from 'react';
import DiscoveryCard from './DiscoveryCard';
import { nearbyPlacesService } from '../services/nearbyPlacesService';
import { restaurantImages } from '../utils/fallbackImages'; 

const NearbyTourism = ({ lat, lon, destination, onExplore, onDataLoaded }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const data = await nearbyPlacesService.getPopularPlacesNearDestination(lat, lon);
      const topPlaces = data.slice(0, 4);
      setPlaces(topPlaces);
      if (onDataLoaded) onDataLoaded(topPlaces);
      setLoading(false);
    };
    if (lat && lon) fetchPlaces();
  }, [lat, lon]);

  if (loading) return (
      <div className="mt-16 pt-16 border-t border-slate-200">
          <div className="animate-pulse h-10 w-80 bg-slate-200 rounded-xl mb-8"></div>
          <div className="flex overflow-x-auto gap-6">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-80 min-w-[280px] bg-slate-100 rounded-3xl"></div>)}
          </div>
      </div>
  );
  
  if (places.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-slate-200">
      <h3 className="text-3xl font-black text-slate-900 mb-2">Popular Tourist Places Near {destination}</h3>
      <p className="text-slate-500 mb-8 font-medium">Explore famous destinations within a 150 km radius.</p>
      <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide">
        {places.map((place, idx) => (
          <div key={idx} className="min-w-[280px] max-w-[320px] h-full flex-shrink-0">
            <DiscoveryCard 
              place={place} 
              onExplore={onExplore}
              imageSrc={restaurantImages[(idx + 1) % restaurantImages.length]} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyTourism;
