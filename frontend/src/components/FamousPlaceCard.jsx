import React from 'react';
import { MapPin, Navigation, Clock, Sparkles, Compass, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const FamousPlaceCard = ({ place, type, onExplore }) => {
  // Determine Theme styling and HSL colors
  const getThemeStyles = (themeName) => {
    const theme = (themeName || 'Cultural').toLowerCase();
    switch (theme) {
      case 'spiritual':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
          gradient: 'from-amber-500/20 to-transparent',
          pill: 'bg-amber-100 text-amber-800 border-amber-300/40'
        };
      case 'historical':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600',
          gradient: 'from-indigo-500/20 to-transparent',
          pill: 'bg-indigo-100 text-indigo-800 border-indigo-300/40'
        };
      case 'scenic':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
          gradient: 'from-emerald-500/20 to-transparent',
          pill: 'bg-emerald-100 text-emerald-800 border-emerald-300/40'
        };
      case 'heritage':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600',
          gradient: 'from-rose-500/20 to-transparent',
          pill: 'bg-rose-100 text-rose-800 border-rose-300/40'
        };
      case 'adventure':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-600',
          gradient: 'from-sky-500/20 to-transparent',
          pill: 'bg-sky-100 text-sky-800 border-sky-300/40'
        };
      default: // Cultural
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
          gradient: 'from-purple-500/20 to-transparent',
          pill: 'bg-purple-100 text-purple-800 border-purple-300/40'
        };
    }
  };

  const themeMeta = getThemeStyles(place.theme);
  const imageSrc = place.imageSrc || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80';
  const popularity = place.popularityScore || place.popularity || 85;

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="bg-white/70 backdrop-blur-xl rounded-[36px] overflow-hidden border border-white/40 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_36px_72px_-20px_rgba(99,102,241,0.18)] transition-all flex flex-col h-[520px] w-[310px] md:w-[340px] shrink-0 snap-start select-none relative group"
    >
      {/* Subtle top corner gradient */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${themeMeta.gradient} blur-2xl rounded-full pointer-events-none`} />

      {/* Floating Popularity Circular Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black text-white shadow-md border border-white/10 uppercase tracking-widest">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
        Popularity {popularity}%
      </div>

      {/* Landmark Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-950 shrink-0">
        <img
          src={imageSrc}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-all duration-800 ease-out opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        
        {/* HSL theme badge floating on bottom-left of image */}
        <div className={`absolute bottom-4 left-4 border backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${themeMeta.pill}`}>
          {place.theme || 'Cultural'}
        </div>
      </div>

      {/* Glassmorphic card body */}
      <div className="p-6 flex flex-col justify-between flex-1 relative z-10 bg-white/30">
        
        <div className="space-y-3.5">
          {/* Place Title */}
          <h4 
            className="text-lg md:text-xl font-black text-slate-800 leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1" 
            onClick={() => onExplore(place)}
          >
            {place.name}
          </h4>
          
          {/* City / State geolocated indicator */}
          <div className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-500 font-bold leading-tight line-clamp-1">
              {place.formattedLocation || `${place.city}, India`}
            </span>
          </div>

          {/* Captivating Significance Block */}
          <div className="bg-indigo-50/40 rounded-2xl p-3.5 border border-indigo-100/30">
            <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
              <Award className="w-3.5 h-3.5 shrink-0" /> Travel Significance
            </div>
            <p className="text-[11px] font-semibold text-slate-600/90 leading-relaxed line-clamp-3">
              {place.reason || 'Culturally significant landmark capturing regional tourism interest annually.'}
            </p>
          </div>
        </div>

        {/* Detour and Action Row */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
          
          {/* Smart distance labels */}
          <div className="flex flex-col gap-1 pr-1 shrink-0">
            {type === 'route' ? (
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600">
                <Navigation className="w-4 h-4 text-indigo-500 rotate-45 shrink-0" />
                <span className="line-clamp-1 text-[11px]">{place.distanceFromRoute || 'Along route'}</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[11px]">{place.distance || 'Nearby'}</span>
                </div>
                {place.travelTime && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{place.travelTime}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explore on Map with Compass Mini Map Icon */}
          <button
            onClick={() => onExplore(place)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-sm border border-indigo-100/30 group-hover:scale-102 active:scale-95 shrink-0"
          >
            Explore on Map <Compass className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FamousPlaceCard;
