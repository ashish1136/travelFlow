import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Compass, Map, Sparkles } from 'lucide-react';

const LoadingState = ({ message = "Crafting your perfect itinerary..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-12"
      >
        {/* Pulsing rings */}
        <motion.div
           animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
        />
        
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10">
          <Plane className="w-12 h-12 animate-bounce" />
        </div>

        {/* Orbiting icons */}
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
           className="absolute -inset-8 pointer-events-none"
        >
          <Compass className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-secondary" />
          <Map className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 text-indigo-400" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2 justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
          {message}
        </h2>
        <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
          We're analyzing thousands of spots to ensure your trip is legendary. Hang tight!
        </p>
      </motion.div>

      {/* Progress placeholder bar */}
      <div className="mt-12 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ x: [-256, 256] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-full bg-primary"
        />
      </div>
    </div>
  );
};

export default LoadingState;
