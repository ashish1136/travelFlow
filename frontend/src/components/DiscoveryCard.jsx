import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

const DiscoveryCard = ({ place, onExplore, imageSrc }) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group flex flex-col h-full min-w-[280px]">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img 
          src={imageSrc} 
          alt={place.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm border border-white/50">
          {place.category || 'Attraction'}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h4 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">{place.name}</h4>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{place.description || 'A beautiful place to explore during your journey.'}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
          {place.distance !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <MapPin className="w-3.5 h-3.5" /> 
              {(place.distance / 1000).toFixed(1)} km away
            </div>
          )}
          <button 
            onClick={() => onExplore(place)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-xl group-hover:bg-indigo-100"
          >
            Route <Navigation className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryCard;
