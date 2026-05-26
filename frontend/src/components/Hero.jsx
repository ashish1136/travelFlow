import React, { useState } from 'react';
import { Calendar, Search, ArrowRight, Sparkles, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AutocompleteInput from './AutocompleteInput';
import { locationService } from '../services/locationService';

const Hero = () => {
  const [sourceCity, setSourceCity] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePlanTrip = async (e) => {
    e.preventDefault();
    if (!sourceCity || !destination) {
        setError("Please enter both starting location and destination.");
        return;
    }
    
    setLoading(true);
    setError('');

    try {
        const sourceValid = await locationService.validateCity(sourceCity);
        if (!sourceValid) {
            setError(`Could not find starting location: ${sourceCity}`);
            setLoading(false);
            return;
        }

        const destValid = await locationService.validateCity(destination);
        if (!destValid) {
            setError(`Could not find destination: ${destination}`);
            setLoading(false);
            return;
        }

        // Add a slight delay for "smart" feeling
        setTimeout(() => {
          navigate(`/results?source=${encodeURIComponent(sourceCity)}&destination=${encodeURIComponent(destination)}&days=${days}`);
        }, 800);
    } catch (err) {
        setError("An error occurred during validation. Please try again.");
        setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-20 flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />
      
      <div className="max-w-5xl mx-auto px-4 text-center mb-12">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 border border-primary/20 shadow-sm">
            <Sparkles className="w-4 h-4 fill-primary/20" />
            V2.0 AI-Powered Personal Concierge
          </span>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tightest mb-8 leading-[0.9]">
            Your next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Great Escape</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">
            Specify a city in India and get 3 distinct, optimized travel plans in seconds. 
            Real-time tracking, 3-tier budgets, and iconic landmarks.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form 
          onSubmit={handlePlanTrip}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-3 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center gap-3 w-full max-w-5xl mx-auto backdrop-blur-xl bg-white/80"
        >
          {error && (
            <div className="w-full text-rose-500 bg-rose-50 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold mx-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <div className="flex-1 w-full">
                <AutocompleteInput 
                  placeholder="Where are you travelling from? (e.g. Delhi)" 
                  value={sourceCity}
                  onChange={(val) => { setSourceCity(val); setError(''); }}
                />
              </div>

              <div className="flex-1 w-full">
                <AutocompleteInput 
                  placeholder="Where do you want to travel? (e.g. Chandigarh)" 
                  value={destination}
                  onChange={(val) => { setDestination(val); setError(''); }}
                />
              </div>

              <div className="w-full md:w-44 flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[28px] border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all group">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0 group-focus-within:text-primary transition-colors" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Duration</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="6"
                      value={days}
                      onChange={(e) => setDays(Math.min(6, Math.max(1, e.target.value)))}
                      className="bg-transparent border-none focus:outline-none w-full text-slate-900 font-bold text-lg"
                      required
                    />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !destination || !sourceCity}
                className="w-full md:w-auto bg-slate-900 text-white min-w-[200px] h-[72px] rounded-[32px] font-black text-lg flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl hover:shadow-primary/20 hover:translate-y-[-4px] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
              >
                {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <>
                        <Search className="w-6 h-6" />
                        <span>Generate</span>
                        <ArrowRight className="w-6 h-6 ml-2" />
                    </>
                )}
              </button>
          </div>
        </motion.form>
      </div>

      {/* Featured Cities Section */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-12 pb-24">
        <div className="flex flex-wrap justify-center gap-10">
          {[
            { name: 'Varanasi', tag: 'Spiritual' },
            { name: 'Goa', tag: 'Nightlife' },
            { name: 'Manali', tag: 'Scenic' },
            { name: 'Hampi', tag: 'Heritage' }
          ].map((city, i) => (
            <motion.div 
                key={i}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setDestination(city.name)}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{city.name}</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Explore {city.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
