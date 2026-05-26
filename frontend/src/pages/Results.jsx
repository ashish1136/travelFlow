import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { openTripMapService } from '../services/openTripMap';
import { generatePlans } from '../utils/itineraryEngine';
import { hotelImages, restaurantImages, getCityPreviewImage } from '../utils/fallbackImages';
import { Backpack, Car, Crown, ArrowRight, Navigation, MapPin, Sparkles, BedDouble, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import LoadingState from '../components/LoadingState';
import { AuthContext } from '../context/AuthContext';
import JourneyExperienceCards from '../components/JourneyExperienceCards';
import axios from 'axios';
import { unsplashService } from '../services/unsplashService';
import { API_URL } from '../services/apiClient';

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const { user } = React.useContext(AuthContext);

  const source = searchParams.get('source');
  const destination = searchParams.get('destination');
  const days = parseInt(searchParams.get('days') || '3');
  const cleanCityName = destination ? (destination.toLowerCase().trim() === 'del' ? 'Delhi' : destination) : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const geo = await openTripMapService.geocode(destination);
        const attractions = await openTripMapService.getAttractions(geo.lat, geo.lon, destination);
        const fetchedHotels = await openTripMapService.getHotels(geo.lat, geo.lon);
        const fetchedRestaurants = await openTripMapService.getRestaurants(geo.lat, geo.lon);

        const topHotels = fetchedHotels.slice(0, 6);
        const topRestaurants = fetchedRestaurants.slice(0, 6);
        setHotels(topHotels);
        setRestaurants(topRestaurants);

        const generated = generatePlans(
          attractions,
          fetchedHotels,
          days,
          geo.rank
        );

        setPlans(generated);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (destination) fetchData();
  }, [destination, days]);

  const handleSelectPlan = (planId) => {
    navigate(`/plan-details?plan=${planId}&source=${encodeURIComponent(source || '')}&destination=${encodeURIComponent(destination)}&days=${days}`);
  };

  const handleSaveItinerary = async (plan, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSavingPlanId(plan.id);

      const previewImg = getCityPreviewImage(destination);

      const itineraryData = {
        source,
        destination,
        title: plan.name,
        name: plan.name,
        description: plan.description,
        analytics: plan.analytics,
        totalDays: plan.days.length,
        days: plan.days,
        hotels: hotels,
        restaurants: restaurants,
        routes: [], // Routes are generated in PlanDetails, skip or mock here
        weather: null,
        previewImage: previewImg
      };

      await axios.post(`${API_URL}/api/itineraries/save`, itineraryData);
      setSavedPlanId(plan.id);
      setTimeout(() => setSavedPlanId(null), 3000);
    } catch (err) {
      console.error('Error saving itinerary', err);
    } finally {
      setSavingPlanId(null);
    }
  };

  if (loading) {
    return <LoadingState message={`Analyzing tracks for ${destination}...`} />;
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <Navbar />

      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            Intelligence Engine Results
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
            Explore {destination}
          </h1>
          <div className="flex items-center justify-center gap-6">
            <span className="h-px w-12 bg-slate-200 hidden md:block" />
            <p className="text-xl text-slate-500 font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {days} Days Personalized Itinerary
            </p>
            <span className="h-px w-12 bg-slate-200 hidden md:block" />
          </div>
        </header>

        <JourneyExperienceCards
          plans={plans}
          savingPlanId={savingPlanId}
          savedPlanId={savedPlanId}
          handleSelectPlan={handleSelectPlan}
          handleSaveItinerary={handleSaveItinerary}
        />

        {/* City Essentials Section */}
        <div className="mt-40">
          <header className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-6"
            >
              <BedDouble className="w-3 h-3 text-primary" />
              City Essentials
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Luxury & Dining</h2>
            <p className="text-xl text-slate-500 font-medium">Curated premium stays and top-rated culinary experiences in {destination}</p>
          </header>

          <div className="space-y-24">
            {/* Hotels */}
            {hotels.length > 0 && (
              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <BedDouble className="w-6 h-6" />
                  </span>
                  Premium Stays
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {hotels.map((hotel, idx) => (
                    <div
                      key={hotel.id}
                      className="group relative h-[400px] rounded-[40px] overflow-hidden block shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-slate-900">
                        <img
                          src={hotelImages[idx % hotelImages.length]}
                          alt={hotel.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = hotelImages[(idx + 1) % hotelImages.length]; }}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black text-white bg-indigo-500/80 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                            Luxury Hotel
                          </span>
                        </div>
                        <h4 className="font-black text-white text-3xl leading-tight mb-2 group-hover:text-indigo-300 transition-colors">{hotel.name}</h4>

                        <div className="mt-6 flex flex-wrap gap-2 pointer-events-auto z-20 relative">
                          <a
                            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[70px] bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl text-center shadow transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            Booking
                          </a>
                          <a
                            href={`https://www.google.com/search?q=site:goibibo.com+${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[70px] bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl text-center shadow transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            Goibibo
                          </a>
                          <a
                            href={`https://www.google.com/search?q=site:oyorooms.com+${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[70px] bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl text-center shadow transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            OYO
                          </a>
                          <a
                            href={`https://www.google.com/search?q=site:makemytrip.com+${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[70px] bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl text-center shadow transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            MMT
                          </a>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div>
                <h3 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl">
                    🍽️
                  </span>
                  Culinary Excellence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {restaurants.map((rest, idx) => (
                    <a
                      key={rest.id}
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.name + ', ' + destination)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-[400px] rounded-[40px] overflow-hidden block shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-slate-900">
                        <img
                          src={restaurantImages[idx % restaurantImages.length]}
                          alt={rest.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = restaurantImages[(idx + 1) % restaurantImages.length]; }}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black text-white bg-orange-500/80 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                            Fine Dining
                          </span>
                        </div>
                        <h4 className="font-black text-white text-3xl leading-tight mb-2 group-hover:text-orange-300 transition-colors">{rest.name}</h4>
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2 mb-2">
                          <MapPin className="w-3 h-3" /> {rest.lat.toFixed(4)}, {rest.lon.toFixed(4)}
                        </div>
                        <div className="flex items-center justify-between mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                          <span className="text-sm font-bold text-white flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/30">
                            View on Map <MapPin className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
