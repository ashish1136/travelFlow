import React, { useEffect, useState } from 'react';
import FamousPlaceCard from './FamousPlaceCard';
import { routeTourismService } from '../services/routeTourismService';
import { Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NearbyFamousDestinations = ({ destination, planId, onExplore, onDataLoaded }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Radius state management
  const defaultRadius = planId === 'routeA' ? 50 : planId === 'routeB' ? 100 : 150;
  const [radius, setRadius] = useState(defaultRadius);
  const [tempRadius, setTempRadius] = useState(defaultRadius);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync radius with planId changes initially
  useEffect(() => {
    const r = planId === 'routeA' ? 50 : planId === 'routeB' ? 100 : 150;
    setRadius(r);
    setTempRadius(r);
  }, [planId]);

  useEffect(() => {
    let active = true;
    const fetchNearbyPlaces = async () => {
      if (!destination) return;
      setLoading(true);
      try {
        // Fetch locations with our custom interactive radius
        const spots = await routeTourismService.getNearbyDestinations(destination, planId, radius);
        if (active) {
          setPlaces(spots || []);
          if (onDataLoaded && spots) {
            onDataLoaded(spots);
          }
        }
      } catch (err) {
        console.error('Error fetching nearby famous places:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNearbyPlaces();

    return () => {
      active = false;
    };
  }, [destination, planId, radius]);

  const handleApplyRadius = () => {
    setRadius(tempRadius);
    setIsFilterOpen(false);
  };

  const getTravelBannerText = (r) => {
    if (r <= 50) return `Quick getaway — less than 1 hr from ${destination}`;
    if (r <= 100) return `Day trip — 1–2 hrs from ${destination}`;
    if (r <= 200) return `Long drive or overnight — 2–4 hrs from ${destination}`;
    return `Weekend trip or adventure — 4+ hrs from ${destination}`;
  };

  if (loading && places.length === 0) return (
    <div className="mt-16 pt-16 border-t border-slate-200/60">
      <div className="animate-pulse flex items-center justify-between mb-4">
        <div className="h-9 w-80 bg-slate-200 rounded-2xl"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-2xl"></div>
      </div>
      <div className="animate-pulse h-4 w-96 bg-slate-100 rounded-xl mb-10"></div>
      <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-[520px] w-[310px] md:w-[340px] bg-slate-100 rounded-[36px] shrink-0 border border-slate-100/60"></div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      className="mt-16 pt-16 border-t border-slate-200/60"
    >
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse fill-emerald-50/50" />
            INTUITION HUB: REGIONAL EXPEDITIONS
          </span>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            Popular Tourist Places Near {destination}
          </h3>
          <p className="text-slate-500 font-semibold text-xs md:text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Showing real places within <span className="text-indigo-600 font-extrabold">{radius} km</span> radius
          </p>
        </div>

        {/* Set Radius Trigger Button */}
        <button 
          onClick={() => {
            setTempRadius(radius);
            setIsFilterOpen(!isFilterOpen);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-sm border transition-all text-xs font-black select-none ${
            isFilterOpen 
              ? 'bg-slate-900 text-white border-slate-900' 
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <SlidersHorizontal className={`w-3.5 h-3.5 ${isFilterOpen ? 'text-white' : 'text-indigo-500'}`} />
          Set Radius
          <span className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-sm ${
            isFilterOpen 
              ? 'bg-white/10 text-white border-white/10' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-100/30'
          }`}>
            {radius} km
          </span>
        </button>
      </div>

      {/* Slider Interactive Dropdown */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 mb-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black text-slate-950 mb-1">Search Radius</h4>
                <p className="text-slate-400 font-bold text-xs">How far from {destination} should we look? (Max: 250 km)</p>
              </div>
              <div className="text-5xl font-black text-indigo-600 tracking-tighter flex items-baseline gap-0.5">
                {tempRadius}<span className="text-lg text-slate-400 font-extrabold ml-1">km</span>
              </div>
            </div>
            
            {/* Range Slider */}
            <div className="relative mb-6">
              <input 
                type="range" 
                min="25" 
                max="250" 
                step="5"
                value={tempRadius} 
                onChange={(e) => setTempRadius(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400 px-1 mt-2">
                <span>25 km</span>
                <span>50 km</span>
                <span>75 km</span>
                <span>100 km</span>
                <span>150 km</span>
                <span>200 km</span>
                <span>250 km</span>
              </div>
            </div>

            {/* Travel Time Banner */}
            <div className="bg-amber-50/60 border border-amber-100/50 rounded-2xl p-4 mb-6 flex items-center gap-3 text-amber-800 text-xs font-black">
              <span className="text-base leading-none">🚗</span>
              <span>{getTravelBannerText(tempRadius)}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleApplyRadius}
                className="flex-1 py-4 bg-slate-950 hover:bg-indigo-600 active:scale-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Apply & Search
              </button>
              <button 
                onClick={() => {
                  setTempRadius(radius);
                  setIsFilterOpen(false);
                }}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Places List */}
      {places.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[32px] p-16 text-center">
          <p className="text-slate-400 font-bold text-sm">No notable tourist destinations found within this radius.</p>
          <p className="text-slate-300 text-xs mt-1">Try expanding the set search radius.</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide select-none snap-x snap-mandatory min-h-[540px]">
          {places.map((place, idx) => (
            <div key={idx} className="snap-start shrink-0 h-full">
              <FamousPlaceCard 
                place={place} 
                type="nearby"
                onExplore={onExplore} 
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default NearbyFamousDestinations;
