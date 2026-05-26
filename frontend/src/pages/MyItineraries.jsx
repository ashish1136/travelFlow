import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { getCityPreviewImage } from '../utils/fallbackImages';
import { API_URL } from '../services/apiClient';

const MyItineraries = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchItineraries = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/itineraries/user`);
        setItineraries(data);
      } catch (error) {
        console.error('Error fetching itineraries', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [user, navigate]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await axios.delete(`${API_URL}/api/itineraries/${id}`);
        setItineraries(itineraries.filter(it => it._id !== id));
      } catch (error) {
        console.error('Error deleting itinerary', error);
      }
    }
  };

  const openItinerary = (itinerary) => {
    // Navigate to PlanDetails and pass the exact saved itinerary
    navigate('/plan-details', { state: { plan: itinerary, isSaved: true } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Itineraries</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No itineraries yet</h3>
            <p className="text-slate-500 mb-6">Start planning your next adventure to see it here.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md"
            >
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <div 
                key={itinerary._id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => openItinerary(itinerary)}
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={getCityPreviewImage(itinerary.destination, itinerary.previewImage)} 
                    alt={itinerary.destination}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80"; 
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white drop-shadow-md truncate">
                      {itinerary.title || `${itinerary.destination} Trip`}
                    </h3>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(itinerary._id, e)}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-slate-600 text-sm font-medium">
                      <MapPin className="w-4 h-4 mr-1 text-primary" />
                      {itinerary.destination}
                    </div>
                    <div className="flex items-center text-slate-600 text-sm font-medium">
                      <Calendar className="w-4 h-4 mr-1 text-primary" />
                      {itinerary.totalDays} Days
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Created {new Date(itinerary.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-primary font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                      View full itinerary <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyItineraries;
