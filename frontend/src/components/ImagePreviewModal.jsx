import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, MapPin } from 'lucide-react';
import { openTripMapService } from '../services/openTripMap';
import { templeImages, monumentImages, mallImages, defaultAttractionImages, hotelImages, restaurantImages } from '../utils/fallbackImages';

const ImagePreviewModal = ({ isOpen, onClose, place }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fallbackImage, setFallbackImage] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (isOpen && place) {
        setLoading(true);
        // Only fetch if xid is present
        if (place.xid) {
            try {
                const data = await openTripMapService.getPlaceDetails(place.xid);
                setDetails(data);
            } catch (error) {
                setDetails(null);
            }
        } else {
            setDetails(null);
        }
        
        // Setup fallback image based on place type
        const typeStr = (place.type || '').toLowerCase();
        let fallbackArr = defaultAttractionImages;
        if (typeStr.includes('temple') || typeStr.includes('religion') || typeStr.includes('church') || typeStr.includes('mosque')) fallbackArr = templeImages;
        else if (typeStr.includes('monument') || typeStr.includes('historic')) fallbackArr = monumentImages;
        else if (typeStr.includes('mall') || typeStr.includes('shop')) fallbackArr = mallImages;
        else if (typeStr.includes('hotel') || typeStr.includes('accom')) fallbackArr = hotelImages;
        else if (typeStr.includes('restaurant') || typeStr.includes('food')) fallbackArr = restaurantImages;
        
        setFallbackImage(fallbackArr[Math.floor(Math.random() * fallbackArr.length)]);
        
        setLoading(false);
      }
    };
    fetchDetails();
    
    // Cleanup state on unmount or hide
    return () => {
       if (!isOpen) setDetails(null);
    }
  }, [isOpen, place]);

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[9999] overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-64 bg-slate-100 flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                  <span className="text-sm font-bold text-slate-400">Loading Preview...</span>
                </div>
              ) : details?.image ? (
                <img
                  src={details.image}
                  alt={place?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                />
              ) : (
                <img
                  src={fallbackImage}
                  alt={place?.name || "Location"}
                  className="w-full h-full object-cover opacity-90"
                />
              )}
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 text-indigo-500 mb-3 text-xs font-black uppercase tracking-widest">
                <MapPin className="w-4 h-4" />
                {place?.type || 'Attraction'}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{place?.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-h-40 overflow-y-auto pr-2">
                {loading ? 'Fetching details...' : (details?.description || 'No description available for this location.')}
              </p>
              {details?.url && (
                <a href={details.url} target="_blank" rel="noreferrer" className="inline-block mt-4 text-primary text-sm font-bold hover:underline">
                    Read more on Wikipedia
                </a>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
