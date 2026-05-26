import React from 'react';
import { Compass, Crown, Mountain, MapPin, Navigation, Save, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const JourneyExperienceCards = ({ plans, savingPlanId, savedPlanId, handleSelectPlan, handleSaveItinerary }) => {
  
  // Style and color config for each of the 3 distinct generators
  const getExperienceStyles = (planId) => {
    switch (planId) {
      case 'routeA': // Cultural Explorer
        return {
          border: 'bg-gradient-to-r from-emerald-400 to-teal-500',
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100',
          styleLabel: 'HIGH FOOTFALL TOURISM',
          icon: Compass
        };
      case 'routeB': // Heritage Path
        return {
          border: 'bg-gradient-to-r from-purple-500 to-indigo-600',
          iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
          pillBg: 'bg-purple-50 text-purple-700 border-purple-200/50',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100',
          styleLabel: 'CULTURAL & HISTORICAL',
          icon: Crown
        };
      case 'routeC': // Pioneer Trail
        return {
          border: 'bg-gradient-to-r from-slate-700 to-slate-900',
          iconBg: 'bg-slate-900 text-white border border-slate-800',
          pillBg: 'bg-slate-100 text-slate-800 border-slate-200',
          btnBg: 'bg-slate-900 hover:bg-slate-950 text-white shadow-slate-200',
          styleLabel: 'SCENIC & ADVENTURE',
          icon: Mountain
        };
      default:
        return {
          border: 'bg-slate-500',
          iconBg: 'bg-slate-100 text-slate-600',
          pillBg: 'bg-slate-50 text-slate-700',
          btnBg: 'bg-slate-800 text-white',
          styleLabel: 'STANDARD TOURISM',
          icon: Compass
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {plans.map((plan, idx) => {
        const styles = getExperienceStyles(plan.id);
        const Icon = styles.icon;

        return (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.6 }}
            className="bg-white/90 backdrop-blur-xl rounded-[48px] p-10 border border-slate-100/80 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] hover:shadow-[0_48px_96px_-24px_rgba(99,102,241,0.12)] hover:border-indigo-500/20 transition-all flex flex-col group cursor-pointer relative overflow-hidden"
            onClick={() => handleSelectPlan(plan.id)}
          >
            {/* Unique gradient top border */}
            <div className={`absolute top-0 left-0 w-full h-2 ${styles.border}`} />

            {/* Experience Pill Style Label */}
            <div className="flex justify-between items-start mb-8 shrink-0">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${styles.iconBg}`}>
                <Icon className="w-8 h-8 animate-pulse" />
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${styles.pillBg}`}>
                {styles.styleLabel}
              </span>
            </div>
            
            {/* Title & Description */}
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">
              {plan.name}
            </h2>
            <p className="text-slate-500 mb-10 text-[15px] font-medium leading-relaxed flex-1 line-clamp-3">
              {plan.description}
            </p>
            
            {/* Stats Row */}
            <div className="mt-auto pt-8 border-t border-slate-100/60">
              <div className="flex justify-between items-center mb-8 gap-4 shrink-0">
                
                {/* Total Places stat */}
                <div className="p-4 bg-slate-50/50 backdrop-blur-md rounded-2xl flex-1 border border-slate-100/60">
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Stops
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {plan.analytics?.totalPlaces || 0}
                  </div>
                </div>

                {/* Total Distance stat */}
                <div className="p-4 bg-slate-50/50 backdrop-blur-md rounded-2xl flex-1 border border-slate-100/60">
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-slate-400 rotate-45" /> Distance
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {plan.analytics?.totalDistance || 0} <span className="text-xs font-bold text-slate-400">km</span>
                  </div>
                </div>

              </div>
              
              {/* CTA Action Buttons */}
              <div className="flex gap-2">
                <button 
                  className={`flex-1 py-4 rounded-3xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xl group-hover:scale-[1.02] active:scale-95 ${styles.btnBg}`}
                >
                  Explore Itinerary
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={(e) => handleSaveItinerary(plan, e)}
                  disabled={savingPlanId === plan.id || savedPlanId === plan.id}
                  className={`py-4 px-6 rounded-3xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${
                    savedPlanId === plan.id 
                      ? 'bg-emerald-500 text-white shadow-emerald-100' 
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {savedPlanId === plan.id ? (
                    <><Check className="w-4 h-4" /> Saved</>
                  ) : (
                    <><Save className="w-4 h-4" /> {savingPlanId === plan.id ? 'Saving' : 'Save'}</>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default JourneyExperienceCards;
