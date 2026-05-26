import React, { useEffect, useState } from 'react';
import DiscoveryCard from './DiscoveryCard';
import { nearbyPlacesService } from '../services/nearbyPlacesService';
import { hotelImages } from '../utils/fallbackImages'; 

const TopAttractions = ({ lat, lon, destination, onExplore, onDataLoaded }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const data = await nearbyPlacesService.getTopAttractions(lat, lon);
      setPlaces(data);
      if (onDataLoaded) onDataLoaded(data);
      setLoading(false);
    };
    if (lat && lon) fetchPlaces();
  }, [lat, lon]);

  if (loading) return (
      <div className="mt-16 pt-16 border-t border-slate-200">
          <div className="animate-pulse h-10 w-64 bg-slate-200 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-80 bg-slate-100 rounded-3xl w-full"></div>)}
          </div>
      </div>
  );
  
  if (places.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-slate-200">
      <h3 className="text-3xl font-black text-slate-900 mb-2">Top Attractions in {destination}</h3>
      <p className="text-slate-500 mb-8 font-medium">Discover the most iconic landmarks and experiences.</p>
      <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide md:grid md:grid-cols-3">
        {places.map((place, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-0 h-full">
            <DiscoveryCard 
              place={place} 
              onExplore={onExplore}
              imageSrc={hotelImages[(idx + 2) % hotelImages.length]} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopAttractions;
