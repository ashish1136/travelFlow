import React, { useEffect, useState } from 'react';
import FamousPlaceCard from './FamousPlaceCard';
import { routeTourismService } from '../services/routeTourismService';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const FamousRoutePlaces = ({ sourceCity, destCity, planId, journeyRoute, onExplore, onDataLoaded }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchRoutePlaces = async () => {
      if (!sourceCity || !destCity) return;
      setLoading(true);
      try {
        // Fetch stops validated along the actual route polyline with plan-specific filters
        const stops = await routeTourismService.getStopsAlongRoute(sourceCity, destCity, journeyRoute || [], planId);
        if (active) {
          setPlaces(stops || []);
          if (onDataLoaded && stops) {
            onDataLoaded(stops);
          }
        }
      } catch (err) {
        console.error('Error fetching route famous places:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRoutePlaces();

    return () => {
      active = false;
    };
  }, [sourceCity, destCity, journeyRoute, planId]);

  if (loading) return (
    <div className="mt-16 pt-16 border-t border-slate-200/60">
      <div className="animate-pulse flex items-center gap-2 mb-4">
        <div className="h-9 w-80 bg-slate-200 rounded-2xl"></div>
      </div>
      <div className="animate-pulse h-4 w-96 bg-slate-100 rounded-xl mb-10"></div>
      <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-[520px] w-[310px] md:w-[340px] bg-slate-100 rounded-[36px] shrink-0 border border-slate-100/60"></div>
        ))}
      </div>
    </div>
  );

  if (places.length === 0) return null;

  const displayPlaces = places;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mt-16 pt-16 border-t border-slate-200/60"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse fill-indigo-500/20" />
            AI-POWERED ROAD TRIP TOURISM
          </span>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            Most Famous Stops Along Your Journey
          </h3>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            Culturally rich, iconic, and high-footfall pilgrimage or historical locations naturally falling along the route from <span className="text-indigo-600 font-semibold">{sourceCity}</span> to <span className="text-indigo-600 font-semibold">{destCity}</span>.
          </p>
        </div>
      </div>

      {/* Horizontal Scrollable Slide Container */}
      <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide select-none snap-x snap-mandatory min-h-[540px]">
        {displayPlaces.map((place, idx) => (
          <div key={idx} className="snap-start shrink-0 h-full">
            <FamousPlaceCard 
              place={place} 
              type="route"
              onExplore={onExplore} 
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default FamousRoutePlaces;

