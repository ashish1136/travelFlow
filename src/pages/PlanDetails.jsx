import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, Download, Navigation, Clock, 
  IndianRupee, Trophy, Sparkles, BedDouble, 
  MapPin, Maximize2, Minimize2, ChevronDown, Save, Check,
  Compass, Crown, Mountain
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import Navbar from '../components/Navbar';
import LoadingState from '../components/LoadingState';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { openTripMapService } from '../services/openTripMap';
import { orsService } from '../services/ors';
import { generatePlans, calculateDistance } from '../utils/itineraryEngine';
import { hotelImages, restaurantImages, getCityPreviewImage } from '../utils/fallbackImages';
import TopAttractions from '../components/TopAttractions';
import NearbyFamousDestinations from '../components/NearbyFamousDestinations';
import FamousRoutePlaces from '../components/FamousRoutePlaces';
import { locationService } from '../services/locationService';
import { routeService } from '../services/routeService';
import { unsplashService } from '../services/unsplashService';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createCustomIcon = (color, number = '') => new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; font-family: sans-serif;">${number}</div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const planeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const ChangeView = ({ center, zoom, fullMap }) => {
    const map = useMap();
    useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [fullMap, map]);
    return null;
};

const MapBounder = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points && points.length > 0) {
            const lPoints = points.map(p => L.marker([p.lat, p.lon]));
            const group = new L.featureGroup(lPoints);
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

const PlanDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [fullMap, setFullMap] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [destinationInfo, setDestinationInfo] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [previewPlace, setPreviewPlace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { user } = React.useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isSavedItinerary = location.state?.isSaved;
  const initialPlan = location.state?.plan;

  const handleSelectPlanType = (newPlanId) => {
    setSearchParams({
      plan: newPlanId,
      source: resolvedSource || '',
      destination: resolvedDestination || '',
      days: days.toString()
    });
    setSelectedDay(1);
    setCurrentProgress(0);
  };
  
  // All hotels in city
  const [cityHotels, setCityHotels] = useState([]);
  const [cityRestaurants, setCityRestaurants] = useState([]);
  // Track open hotel panels per activity id
  const [expandedHotels, setExpandedHotels] = useState({});
  const [loadingHotels, setLoadingHotels] = useState({});
  const [sourceInfo, setSourceInfo] = useState(null);
  const [attractionMarkers, setAttractionMarkers] = useState([]);
  const [nearbyMarkers, setNearbyMarkers] = useState([]);
  const [routeStopsMarkers, setRouteStopsMarkers] = useState([]);
  const [journeyRoute, setJourneyRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    if (destinationInfo) {
      setMapCenter([destinationInfo.lat, destinationInfo.lon]);
    }
  }, [destinationInfo]);

  const handleFocusPlace = (place) => {
    if (place.lat && place.lon) {
      setMapCenter([place.lat, place.lon]);
      setMapZoom(14);
      setPreviewPlace(place);
    }
  };

  const planId = searchParams.get('plan');
  const source = searchParams.get('source');
  const destination = searchParams.get('destination');
  const days = parseInt(searchParams.get('days') || '3');

  const resolvedDestination = plan?.destination || destination || '';
  const resolvedSource = plan?.source || source || '';
  const resolvedPlanId = plan?.id || planId || 'routeA';

  useEffect(() => {
    if (isSavedItinerary && initialPlan) {
      setPlan(initialPlan);
      const destLat = initialPlan.days[0]?.activities[0]?.lat || 20;
      const destLon = initialPlan.days[0]?.activities[0]?.lon || 78;
      setDestinationInfo({ lat: destLat, lon: destLon });
      if (initialPlan.hotels) setCityHotels(initialPlan.hotels);
      if (initialPlan.restaurants) setCityRestaurants(initialPlan.restaurants);
      setRoutes(initialPlan.routes || []);

      // Load road journey route and source info for saved itineraries as well
      const loadSavedRouteData = async () => {
        const resSource = initialPlan.source || '';
        if (resSource) {
          try {
            const sInfo = await locationService.getCoordinates(resSource);
            setSourceInfo(sInfo);
            if (sInfo) {
              const routeData = await routeService.getRouteAndStops(sInfo.lat, sInfo.lon, destLat, destLon);
              if (routeData && routeData.routeGeometry) {
                setJourneyRoute(routeData.routeGeometry);
              }
            }
          } catch (e) {
            console.error("Error loading route details for saved itinerary:", e);
          }
        }
      };
      loadSavedRouteData();

      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const geo = await openTripMapService.geocode(destination);
        setDestinationInfo(geo);
        const attractions = await openTripMapService.getAttractions(geo.lat, geo.lon, destination);
        const fetchedHotels = await openTripMapService.getHotels(geo.lat, geo.lon, 40);
        const topHotels = fetchedHotels.slice(0, 3);
        const topHotelsWithImages = await Promise.all(topHotels.map(async (h) => {
          try {
            const image = await unsplashService.getImageForPlace(h.name, destination, 'hotel');
            return { ...h, imageSrc: image };
          } catch (e) {
            return h;
          }
        }));
        setCityHotels(topHotelsWithImages);
        
        const fetchedRestaurants = await openTripMapService.getRestaurants(geo.lat, geo.lon, 40);
        const topRestaurants = fetchedRestaurants.slice(0, 3);
        const topRestaurantsWithImages = await Promise.all(topRestaurants.map(async (r) => {
          try {
            const image = await unsplashService.getImageForPlace(r.name, destination, 'restaurant');
            return { ...r, imageSrc: image };
          } catch (e) {
            return r;
          }
        }));
        setCityRestaurants(topRestaurantsWithImages);

        const allPlans = generatePlans(attractions, fetchedHotels, days, geo.rank);
        const selected = allPlans.find(p => p.id === planId);
        setPlan(selected);

        const routePromises = selected.days.map(async (day) => {
            if (day.activities.length === 0) return { geometry: null };
            const points = [[geo.lon, geo.lat], ...day.activities.map(a => [a.lon, a.lat])];
            return await orsService.getDirections(points);
        });
        const fetchedRoutes = await Promise.all(routePromises);
        setRoutes(fetchedRoutes);

        let sInfo = null;
        if (source && !isSavedItinerary) {
            sInfo = await locationService.getCoordinates(source);
            setSourceInfo(sInfo);
        } else if (isSavedItinerary && initialPlan?.source) {
            sInfo = await locationService.getCoordinates(initialPlan.source);
            setSourceInfo(sInfo);
        }

        if (sInfo && geo) {
            try {
                const routeData = await routeService.getRouteAndStops(sInfo.lat, sInfo.lon, geo.lat, geo.lon);
                if (routeData && routeData.routeGeometry) {
                    setJourneyRoute(routeData.routeGeometry);
                }
            } catch (routeErr) {
                console.error("Error fetching road journey route polyline:", routeErr);
            }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (destination) fetchData();
  }, [destination, days, planId, isSavedItinerary, initialPlan, source]);

const curatedCityPreviewImages = {
  chandigarh: [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80", // Serene Sukhna Lake
    "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80"  
  ],
  delhi: [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80", // Red Fort Delhi
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"  
  ],
  del: [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80", // Red Fort Delhi
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"  
  ],
  jaipur: [
    "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=800&q=80", // Hawa Mahal Jaipur
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"  // Amber Fort Palace Jaipur
  ],
  agra: [
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80", // Taj Mahal Agra
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"  // Agra Fort
  ],
  varanasi: [
    "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=800&q=80", // Ganga Ghat Varanasi
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80"  
  ],
  amritsar: [
    "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80", // Golden Temple Amritsar
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80"  
  ],
  mumbai: [
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80", // Gateway of India Mumbai
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"  // Mumbai Skyline
  ],
  patna: [
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80", // Ganges River Patna
    "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80"
  ],
  pune: [
    "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=800&q=80", // Shaniwar Wada Pune
    "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80"  
  ]
};

  const handleSaveItinerary = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSaving(true);
      
      const resolvedCity = destinationInfo?.name || destination || '';
      const previewImg = getCityPreviewImage(resolvedCity);

      const itineraryData = {
        source,
        destination,
        title: plan.name,
        name: plan.name,
        description: plan.description,
        analytics: plan.analytics,
        totalDays: plan.days.length,
        days: plan.days,
        hotels: cityHotels,
        restaurants: cityRestaurants,
        routes: routes,
        weather: null, // You can add weather here if available
        previewImage: previewImg
      };
      
      await axios.post('http://localhost:5000/api/itineraries/save', itineraryData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving itinerary', err);
    } finally {
      setSaving(false);
    }
  };



  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Page styling settings
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (2 * margin);
      let y = margin;

      // Helper for clean line height and page breaks
      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          // Render page header or simple border on new page
          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.setLineWidth(0.5);
          pdf.line(margin, margin - 10, pageWidth - margin, margin - 10);
        }
      };

      // ----------------- PAGE 1: TITLE & TRIP OVERVIEW -----------------
      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(`${plan.name || 'Itinerary'}`, margin, y);
      y += 10;

      pdf.setFontSize(14);
      pdf.setTextColor(79, 70, 229); // indigo-600
      pdf.text(`Personalized Experience in ${resolvedDestination}`, margin, y);
      y += 12;

      // Metadata section
      pdf.setDrawColor(241, 245, 249); // slate-100
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(margin, y, contentWidth, 24, "F");
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text("TOTAL DISTANCE", margin + 10, y + 8);
      pdf.text("PLACES COUNT", margin + 55, y + 8);
      pdf.text("EST. TRANSIT", margin + 105, y + 8);
      pdf.text("DAYS COUNT", margin + 145, y + 8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text(`${plan.analytics?.totalDistance || 0} km`, margin + 10, y + 16);
      pdf.text(`${plan.days?.reduce((acc, d) => acc + d.activities.length, 0) || 0} stops`, margin + 55, y + 16);
      pdf.text(`${plan.analytics?.travelHours || 0} hrs`, margin + 105, y + 16);
      pdf.text(`${plan.days.length} days`, margin + 145, y + 16);
      
      y += 34;

      // Summary Description
      if (plan.description) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(71, 85, 105); // slate-600
        const descLines = pdf.splitTextToSize(plan.description, contentWidth);
        checkPageBreak(descLines.length * 5 + 10);
        pdf.text(descLines, margin, y);
        y += descLines.length * 5 + 12;
      }

      // ----------------- SECTION: PLACES ALONG THE JOURNEY -----------------
      if (routeStopsMarkers && routeStopsMarkers.length > 0) {
        checkPageBreak(30);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59); // slate-800
        pdf.text("Places Along the Journey", margin, y);
        y += 8;

        routeStopsMarkers.forEach((stop, idx) => {
          checkPageBreak(22);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`• ${stop.name} (${stop.city || 'Route Corridor'})${stop.distanceFromRoute ? ' - ' + stop.distanceFromRoute : ''}`, margin + 5, y);
          y += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          const locationText = stop.formattedLocation || `${stop.city || 'Route Corridor'}, India`;
          pdf.text(`Location: ${locationText}`, margin + 8, y);
          y += 4.5;

          if (stop.reason) {
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(8.5);
            pdf.setTextColor(71, 85, 105);
            const reasonLines = pdf.splitTextToSize(`Significance: ${stop.reason}`, contentWidth - 15);
            pdf.text(reasonLines, margin + 8, y);
            y += reasonLines.length * 4 + 2;
          } else {
            y += 1;
          }
        });
        y += 6;
      }

      // ----------------- SECTION: FAMOUS PLACES NEAR DESTINATION -----------------
      if (nearbyMarkers && nearbyMarkers.length > 0) {
        checkPageBreak(30);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59); // slate-800
        pdf.text(`Famous Places Near Destination (${resolvedDestination})`, margin, y);
        y += 8;

        nearbyMarkers.forEach((place, idx) => {
          checkPageBreak(22);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`• ${place.name} (${place.distance || 'Nearby'})`, margin + 5, y);
          y += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          const locationText = place.formattedLocation || `${place.city || resolvedDestination}, India`;
          pdf.text(`Location: ${locationText}${place.travelTime ? ' | Travel Time: ' + place.travelTime : ''}`, margin + 8, y);
          y += 4.5;

          if (place.reason) {
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(8.5);
            pdf.setTextColor(71, 85, 105);
            const reasonLines = pdf.splitTextToSize(`Significance: ${place.reason}`, contentWidth - 15);
            pdf.text(reasonLines, margin + 8, y);
            y += reasonLines.length * 4 + 2;
          } else {
            y += 1;
          }
        });
        y += 6;
      }

      // Divider before days
      checkPageBreak(15);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // ----------------- SECTION: DAYWISE CONTENTS -----------------
      plan.days.forEach((day) => {
        checkPageBreak(25);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text(`Day ${day.day}`, margin, y);
        y += 8;

        if (day.activities.length === 0) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.setTextColor(148, 163, 184); // slate-400
          pdf.text("No specific tourist places scheduled for this day.", margin + 5, y);
          y += 10;
          return;
        }

        day.activities.forEach((act, idx) => {
          checkPageBreak(35);

          // Marker Number
          pdf.setFillColor(30, 41, 59); // slate-800
          pdf.rect(margin, y - 4, 6, 6, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`${idx + 1}`, margin + 2, y);

          // Stop name
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(15, 23, 42); // slate-900
          pdf.text(act.name, margin + 10, y);
          
          // Time
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139); // slate-500
          pdf.text(`[ Scheduled: ${act.time || 'flexible'} ]`, pageWidth - margin - 45, y);
          y += 5;

          // Type & Distance
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(79, 70, 229); // indigo-600
          let detailsStr = `${act.type ? act.type.toUpperCase() : 'VISIT'}`;
          if (idx > 0 && act.distanceFromPrevKm) {
            detailsStr += `  |  TRAVEL: ${act.distanceFromPrevKm} KM`;
          }
          pdf.text(detailsStr, margin + 10, y);
          y += 6;

          // Description or address if any
          if (act.description) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(71, 85, 105); // slate-600
            const actDescLines = pdf.splitTextToSize(act.description, contentWidth - 15);
            pdf.text(actDescLines, margin + 10, y);
            y += actDescLines.length * 4.5 + 4;
          } else {
            y += 2;
          }
          y += 4; // Spacing between activities
        });

        y += 6; // Spacing between days
      });

      // ----------------- SECTION: PREMIUM HOTELS -----------------
      if (cityHotels && cityHotels.length > 0) {
        checkPageBreak(30);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text("Recommended Premium Stays", margin, y);
        y += 8;

        cityHotels.forEach((hotel, idx) => {
          checkPageBreak(20);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${idx + 1}. ${hotel.name}`, margin + 5, y);
          y += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Address: ${hotel.address || 'Premium Stay in ' + destination}`, margin + 8, y);
          y += 5;
        });
        y += 6;
      }

      // ----------------- SECTION: CULINARY DINING -----------------
      if (cityRestaurants && cityRestaurants.length > 0) {
        checkPageBreak(30);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text("Culinary Excellence & Dining Sights", margin, y);
        y += 8;

        cityRestaurants.forEach((rest, idx) => {
          checkPageBreak(20);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(30, 41, 59);
          pdf.text(`${idx + 1}. ${rest.name}`, margin + 5, y);
          y += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Coordinates: ${rest.lat.toFixed(4)}, ${rest.lon.toFixed(4)}`, margin + 8, y);
          y += 5;
        });
        y += 6;
      }

      pdf.save(`Itinerary_${destination.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("Failed to generate native PDF itinerary:", err);
      alert("There was an error generating the PDF.");
    }
  };

  const decodePolyline = (str, precision) => {
    var index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision || 5);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change; lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
  };

  const currentRouteCoords = useMemo(() => {
    if (!routes[selectedDay - 1]?.geometry) {
        // Fallback: draw straight lines between points if route fails
        if (!plan || !destinationInfo) return [];
        const activeActivities = plan.days[selectedDay - 1].activities;
        const fallbackPoints = [ [destinationInfo.lat, destinationInfo.lon], ...activeActivities.map(a => [a.lat, a.lon]) ];
        return fallbackPoints;
    }
    return decodePolyline(routes[selectedDay - 1].geometry);
  }, [routes, selectedDay, plan, destinationInfo]);

  const movingMarkerPos = useMemo(() => {
    if (currentRouteCoords.length === 0) return null;
    const index = Math.floor((currentProgress / 100) * (currentRouteCoords.length - 1));
    return currentRouteCoords[index];
  }, [currentRouteCoords, currentProgress]);

  const toggleHotels = async (act) => {
    if (expandedHotels[act.id] !== undefined) {
        setExpandedHotels(prev => ({ ...prev, [act.id]: undefined }));
        return;
    }

    setLoadingHotels(prev => ({ ...prev, [act.id]: true }));
    try {
        let nearby = await openTripMapService.getHotels(act.lat, act.lon, 5, 3000); // 3km radius
        if (nearby.length < 2) {
            nearby = await openTripMapService.getHotels(act.lat, act.lon, 5, 7000); // 7km radius fallback
        }
        if (nearby.length < 2) {
            nearby = await openTripMapService.getHotels(act.lat, act.lon, 5, 15000); // 15km radius fallback
        }
        
        nearby = nearby.slice(0, 3);
        setExpandedHotels(prev => ({ ...prev, [act.id]: nearby }));
    } catch (err) {
        setExpandedHotels(prev => ({ ...prev, [act.id]: [] })); 
    } finally {
        setLoadingHotels(prev => ({ ...prev, [act.id]: false }));
    }
  };

  if (loading || !plan) {
    return <LoadingState message={`Building your ${planId} experience...`} />;
  }

  const resolvedCityName = plan?.destination || destinationInfo?.name || destination || '';
  const cleanCityName = resolvedCityName.toLowerCase().trim() === 'del' ? 'Delhi' : resolvedCityName;

  const activeDay = plan.days[selectedDay - 1];

  // We find active hotels bounds to pass to map
  const activeHotelMarkers = Object.values(expandedHotels).flat().filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className={`max-w-[1600px] mx-auto px-4 pt-32 pb-20 grid grid-cols-1 ${fullMap ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-10 transition-all duration-500`}>
        
        {/* Left Column: Schedule */}
        <AnimatePresence>
          {!fullMap && (
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="lg:col-span-7 space-y-10" 
              id="itinerary-content"
            >
              <Link to="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-primary mb-2 transition-all font-bold group">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                New Search
              </Link>

              {/* Experience Type switcher - Image 4 implementation */}
              <div className="space-y-3 bg-white border border-slate-200/50 rounded-[32px] p-6 shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400/80 mb-3 select-none">
                  <span className="flex items-center gap-1.5 font-extrabold">Experience Type</span>
                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider">Shapes your route</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cultural Experience */}
                  <div 
                    onClick={() => handleSelectPlanType('routeA')}
                    className={`relative rounded-2xl p-4 border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between ${
                      resolvedPlanId === 'routeA'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100/50 scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 hover:-translate-y-0.5'
                    }`}
                  >
                    {resolvedPlanId !== 'routeA' && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500/80 animate-pulse" />
                    )}
                    <div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                        resolvedPlanId === 'routeA' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <Compass className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-xs font-black tracking-tight mb-1">Cultural Experience</h4>
                      <p className={`text-[9px] font-semibold leading-relaxed ${
                        resolvedPlanId === 'routeA' ? 'text-indigo-100' : 'text-slate-400'
                      }`}>
                        Art, temples & living traditions
                      </p>
                    </div>
                  </div>

                  {/* Heritage Trail */}
                  <div 
                    onClick={() => handleSelectPlanType('routeB')}
                    className={`relative rounded-2xl p-4 border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between ${
                      resolvedPlanId === 'routeB'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100/50 scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 hover:-translate-y-0.5'
                    }`}
                  >
                    {resolvedPlanId !== 'routeB' && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                    )}
                    <div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                        resolvedPlanId === 'routeB' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <Crown className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-xs font-black tracking-tight mb-1">Heritage Trail</h4>
                      <p className={`text-[9px] font-semibold leading-relaxed ${
                        resolvedPlanId === 'routeB' ? 'text-amber-50' : 'text-slate-400'
                      }`}>
                        Forts, palaces & historical monuments
                      </p>
                    </div>
                  </div>

                  {/* Nature Escape */}
                  <div 
                    onClick={() => handleSelectPlanType('routeC')}
                    className={`relative rounded-2xl p-4 border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between ${
                      resolvedPlanId === 'routeC'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100/50 scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 hover:-translate-y-0.5'
                    }`}
                  >
                    {resolvedPlanId !== 'routeC' && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                    )}
                    <div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                        resolvedPlanId === 'routeC' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Mountain className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-xs font-black tracking-tight mb-1">Nature Escape</h4>
                      <p className={`text-[9px] font-semibold leading-relaxed ${
                        resolvedPlanId === 'routeC' ? 'text-emerald-100' : 'text-slate-400'
                      }`}>
                        Parks, gardens, lakes & landscapes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <header className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                             <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                plan.id === 'routeA' ? 'bg-emerald-100 text-emerald-700' : 
                                plan.id === 'routeB' ? 'bg-indigo-100 text-indigo-700' : 
                                'bg-slate-900 text-white'
                             }`}>
                                Super-Cluster Setup
                             </span>
                             <span className="text-slate-300">/</span>
                             <span className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-primary" /> Verified Route
                             </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[0.95] tracking-tight">
                            {plan.name || plan.title} <br/> <span className="text-primary italic">in {destination || plan.destination}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isSavedItinerary && (
                        <button 
                          onClick={handleSaveItinerary}
                          disabled={saving || saved}
                          className={`flex items-center gap-2 px-6 py-4 rounded-[24px] transition-all shadow-xl font-black text-sm ${
                            saved ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {saved ? <><Check className="w-5 h-5" /> Saved</> : <><Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Itinerary'}</>}
                        </button>
                      )}
                      <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[24px] hover:bg-primary transition-all shadow-xl hover:translate-y-[-4px] active:scale-95 font-black text-sm"
                      >
                        <Download className="w-5 h-5" /> Export PDF
                      </button>
                    </div>
                </div>
              </header>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {plan.days.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => { setSelectedDay(d.day); setCurrentProgress(0); }}
                        className={`px-8 py-4 rounded-[20px] font-black text-sm whitespace-nowrap transition-all border-2 ${
                            selectedDay === d.day 
                            ? 'bg-primary border-primary text-white shadow-lg' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-primary/20 hover:text-primary'
                        }`}
                    >
                        Day {d.day}
                    </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <Navigation className="w-6 h-6 text-indigo-500 mb-3" />
                    <div className="text-2xl font-black text-slate-900">{plan.analytics?.totalDistance || 0} km</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Distance</div>
                 </div>
                 
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <MapPin className="w-6 h-6 text-emerald-500 mb-3" />
                    <div className="text-2xl font-black text-slate-900">{plan.analytics?.totalPlaces || plan.days?.reduce((acc, d) => acc + d.activities.length, 0) || 0}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Unique Places</div>
                 </div>
                 
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <Clock className="w-6 h-6 text-amber-500 mb-3" />
                    <div className="text-2xl font-black text-slate-900">{plan.analytics?.travelHours || 0} hr</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Est. Transit Time</div>
                 </div>

                 {/* Travel Insights Dashboard: Category Breakdown */}
                 <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-sm flex flex-col justify-center items-center text-center text-white min-h-[140px]">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Breakdown</div>
                    <div className="w-full h-20">
                      {plan.analytics?.categoryBreakdown ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={plan.analytics.categoryBreakdown} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={20} 
                              outerRadius={30} 
                              stroke="none"
                            >
                              {plan.analytics.categoryBreakdown.map((entry, index) => {
                                const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px', color: 'white', fontWeight: 'bold' }} 
                                itemStyle={{ color: '#cbd5e1' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-slate-500">Not Available</div>
                      )}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-slate-900">Day {selectedDay} Sequence</h2>
                  </div>

                  <div className="space-y-6 relative border-l-[3px] border-dashed border-slate-200 ml-[18px] pl-10 md:ml-6 md:pl-12 pb-8">
                    {activeDay.activities.length === 0 && (
                         <div className="text-slate-400 font-bold italic py-10">No specific places requested by engine for this day tier. Relax and explore locally!</div>
                    )}
                    {activeDay.activities.map((act, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                        >
                            <div className="absolute -left-[54px] md:-left-[62px] top-6 w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-900 text-white font-black flex items-center justify-center border-4 border-white shadow-md z-10 group-hover:bg-primary transition-colors">
                                {i + 1}
                            </div>
                            
                            {i > 0 && (
                                <div className="absolute -left-[50px] md:-left-[60px] -top-6 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg z-10 shadow-sm">
                                    🚗 {act.distanceFromPrevKm} km
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 mb-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => setPreviewPlace(act)}>
                                            {act.name}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {act.type}
                                            </div>
                                            <button 
                                              onClick={() => setPreviewPlace(act)}
                                              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                            >
                                              <Maximize2 className="w-3 h-3" /> Preview
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{act.time}</span>
                                    </div>
                                </div>
                                
                                {/* Dynamic Hotel Button */}
                                <div className="mt-8 pt-4 border-t border-slate-50">
                                    <button 
                                        onClick={() => toggleHotels(act)}
                                        disabled={loadingHotels[act.id]}
                                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition ${loadingHotels[act.id] ? 'text-slate-400' : 'text-indigo-500 hover:text-indigo-700'}`}
                                    >
                                        <BedDouble className={`w-4 h-4 ${loadingHotels[act.id] ? 'animate-pulse' : ''}`} /> 
                                        {loadingHotels[act.id] ? 'Locating Hotels...' : (expandedHotels[act.id] !== undefined ? 'Hide Hotels' : 'Find Nearby Hotels')}
                                        {!loadingHotels[act.id] && <ChevronDown className={`w-3 h-3 transition-transform ${expandedHotels[act.id] !== undefined ? 'rotate-180' : ''}`} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedHotels[act.id] !== undefined && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden mt-4 space-y-3"
                                            >
                                                {expandedHotels[act.id].length === 0 ? (
                                                    <div className="bg-rose-50 text-rose-500 text-xs font-bold p-4 rounded-xl">
                                                        No hotels available within 10km of this location.
                                                    </div>
                                                ) : (
                                                    expandedHotels[act.id].map(h => (
                                                        <div key={h.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start justify-between">
                                                            <div>
                                                                <h5 className="font-bold text-slate-800 text-sm">{h.name}</h5>
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{h.address || 'Premium Accommodation'}</p>
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    <a 
                                                                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name + ' ' + cleanCityName)}`}
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block text-[9px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                                                                    >
                                                                        Booking
                                                                    </a>
                                                                    <a 
                                                                        href={`https://www.goibibo.com/hotels/find-hotels-in-${encodeURIComponent(cleanCityName.toLowerCase())}/?q=${encodeURIComponent(h.name)}`}
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block text-[9px] font-bold bg-orange-500 text-white px-2 py-1 rounded-lg hover:bg-orange-600 transition-all shadow-sm"
                                                                    >
                                                                        Goibibo
                                                                    </a>
                                                                    <a 
                                                                        href={`https://www.oyorooms.com/search?location=${encodeURIComponent(h.name + ' ' + cleanCityName)}`}
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block text-[9px] font-bold bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition-all shadow-sm"
                                                                    >
                                                                        OYO
                                                                    </a>
                                                                    <a 
                                                                        href={`https://www.makemytrip.com/hotels/hotel-listing/?searchText=${encodeURIComponent(h.name + ' ' + cleanCityName)}`}
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block text-[9px] font-bold bg-sky-500 text-white px-2 py-1 rounded-lg hover:bg-sky-600 transition-all shadow-sm"
                                                                    >
                                                                        MMT
                                                                    </a>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white border border-indigo-100 text-indigo-600 px-2 py-1 rounded text-[10px] font-black uppercase whitespace-nowrap">
                                                                {calculateDistance(act.lat, act.lon, h.lat, h.lon).toFixed(1)} km away
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                  </div>
              </div>

              {/* City Essentials Section */}
              <div className="mt-16 pt-16 border-t border-slate-200">
                <h3 className="text-4xl font-black text-slate-900 mb-8">City Essentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top Hotels */}
                  <div>
                    <h4 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <BedDouble className="w-5 h-5" /> 
                      </span>
                      Premium Stays
                    </h4>
                    <div className="space-y-6">
                      {cityHotels.map((hotel, idx) => (
                        <div 
                           key={hotel.id} 
                           className="group relative h-56 rounded-[24px] overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-slate-900"
                        >
                          <div className="absolute inset-0">
                             <img 
                                src={hotel.imageSrc || hotelImages[idx % hotelImages.length]} 
                                alt={hotel.name}
                                onError={(e) => { e.target.onerror = null; e.target.src = hotelImages[(idx + 1) % hotelImages.length]; }}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                             />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <span className="text-[9px] font-black text-white bg-indigo-500/80 backdrop-blur-md px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest border border-white/20">Top Rated</span>
                            <h5 className="font-black text-white text-base leading-tight mb-3 group-hover:text-indigo-300 transition-colors">{hotel.name}</h5>
                            
                            <div className="flex gap-1.5 z-20 relative pointer-events-auto">
                              <a 
                                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase py-1.5 rounded-lg text-center transition shadow-sm hover:scale-105 active:scale-95"
                              >
                                Booking
                              </a>
                              <a 
                                href={`https://www.goibibo.com/hotels/find-hotels-in-${encodeURIComponent(cleanCityName.toLowerCase())}/?q=${encodeURIComponent(hotel.name)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase py-1.5 rounded-lg text-center transition shadow-sm hover:scale-105 active:scale-95"
                              >
                                Goibibo
                              </a>
                              <a 
                                href={`https://www.oyorooms.com/search?location=${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase py-1.5 rounded-lg text-center transition shadow-sm hover:scale-105 active:scale-95"
                              >
                                OYO
                              </a>
                              <a 
                                href={`https://www.makemytrip.com/hotels/hotel-listing/?searchText=${encodeURIComponent(hotel.name + ' ' + cleanCityName)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-black uppercase py-1.5 rounded-lg text-center transition shadow-sm hover:scale-105 active:scale-95"
                              >
                                MMT
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Restaurants */}
                  <div>
                    <h4 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 text-xl">
                         🍽️
                      </span>
                      Top Dining
                    </h4>
                    <div className="space-y-6">
                      {cityRestaurants.map((rest, idx) => (
                        <a 
                           key={rest.id} 
                           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.name + ', ' + cleanCityName)}`}
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="w-full text-left group relative h-48 rounded-[24px] overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="absolute inset-0 bg-slate-900">
                             <img 
                                src={rest.imageSrc || restaurantImages[idx % restaurantImages.length]} 
                                alt={rest.name}
                                onError={(e) => { e.target.onerror = null; e.target.src = restaurantImages[(idx + 1) % restaurantImages.length]; }}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                             />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <span className="text-[9px] font-black text-white bg-orange-500/80 backdrop-blur-md px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest border border-white/20">Popular</span>
                            <h5 className="font-black text-white text-lg leading-tight group-hover:text-orange-300 transition-colors">{rest.name}</h5>
                            <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                               <MapPin className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explore Along Your Journey */}
              <div className="mt-16 pt-16 border-t border-slate-200">
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Explore Along Your Journey</h2>
                
                <TopAttractions 
                  lat={destinationInfo.lat} 
                  lon={destinationInfo.lon} 
                  destination={resolvedDestination}
                  onExplore={(place) => setPreviewPlace(place)}
                  onDataLoaded={setAttractionMarkers}
                />
                
                <NearbyFamousDestinations 
                  destination={resolvedDestination}
                  planId={resolvedPlanId}
                  onExplore={handleFocusPlace}
                  onDataLoaded={setNearbyMarkers}
                />

                {resolvedSource && resolvedDestination && (
                  <FamousRoutePlaces 
                    sourceCity={resolvedSource}
                    destCity={resolvedDestination}
                    planId={resolvedPlanId}
                    journeyRoute={journeyRoute}
                    onExplore={handleFocusPlace}
                    onDataLoaded={setRouteStopsMarkers}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Column: Sticky Stable Map */}
        <div className={`${fullMap ? 'lg:col-span-12' : 'lg:col-span-5'} h-[calc(100vh-8rem)] sticky top-24 transition-all duration-500`}>
          <div className="bg-slate-900 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden h-full flex flex-col relative border-4 border-slate-200 lg:border-slate-800">
            
            <div className="absolute top-6 right-6 z-[1000] flex gap-2 pointer-events-auto">
                <button onClick={() => setFullMap(!fullMap)} className="w-14 h-14 bg-white/90 backdrop-blur-xl rounded-[24px] flex items-center justify-center text-slate-700 shadow-2xl hover:bg-white transition-all active:scale-95">
                  {fullMap ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1 relative z-0">
                {destinationInfo && (
                    <MapContainer center={mapCenter || [destinationInfo.lat, destinationInfo.lon]} zoom={mapZoom} zoomControl={false} className="w-full h-full">
                        <ChangeView center={mapCenter || [destinationInfo.lat, destinationInfo.lon]} zoom={mapZoom} fullMap={fullMap} />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                        <ZoomControl position="bottomright" />
                        <MapBounder points={[
                            ...activeDay.activities, 
                            ...activeHotelMarkers, 
                            ...cityHotels.slice(0,3), 
                            ...cityRestaurants.slice(0,3),
                            ...(sourceInfo ? [sourceInfo] : []),
                            ...(destinationInfo ? [destinationInfo] : []),
                            ...attractionMarkers,
                            ...nearbyMarkers,
                            ...routeStopsMarkers
                        ]} />

                        {activeDay.activities.map((att, i) => (
                            <Marker key={`att-${i}`} position={[att.lat, att.lon]} icon={createCustomIcon('#0f172a', i + 1)}>
                                <Popup className="custom-popup">
                                    <div className="p-2 min-w-[140px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black border border-white shadow-sm">{i + 1}</div>
                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest">{att.type || 'Location'}</div>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight mb-3 border-b border-slate-100 pb-2">{att.name}</h4>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setPreviewPlace(att); }}
                                            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-[10px] font-black uppercase py-2 rounded-lg"
                                        >
                                            View Preview
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        
                        {activeHotelMarkers.map((h, i) => (
                            <Marker key={`hot-act-${i}`} position={[h.lat, h.lon]} icon={createCustomIcon('#6366f1', 'H')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-indigo-500 uppercase mb-1">Nearby Hotel</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{h.name}</h4>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Global City Essentials Markers */}
                        {cityHotels.slice(0, 3).map((h, i) => (
                            <Marker key={`global-hot-${i}`} position={[h.lat, h.lon]} icon={createCustomIcon('#6366f1', 'H')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-indigo-500 uppercase mb-1">Top Hotel</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{h.name}</h4>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {cityRestaurants.slice(0, 3).map((r, i) => (
                            <Marker key={`global-rest-${i}`} position={[r.lat, r.lon]} icon={createCustomIcon('#f97316', '🍽️')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-orange-500 uppercase mb-1">Top Restaurant</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{r.name}</h4>
                                        <div className="text-[10px] text-slate-500 mt-1">{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {currentRouteCoords.length > 0 && (
                            <Polyline positions={currentRouteCoords} color="#4f46e5" weight={5} opacity={0.9} />
                        )}

                        {tracking && movingMarkerPos && (
                            <Marker position={movingMarkerPos} icon={planeIcon} />
                        )}

                        {/* Source marker */}
                        {sourceInfo && (
                            <Marker position={[sourceInfo.lat, sourceInfo.lon]} icon={createCustomIcon('#10b981', 'S')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">Starting Point</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{source || 'Start'}</h4>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Destination marker */}
                        {destinationInfo && (
                            <Marker position={[destinationInfo.lat, destinationInfo.lon]} icon={createCustomIcon('#ef4444', 'D')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-red-500 uppercase mb-1">Destination</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{destination}</h4>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Journey Route (theme-colored polyline) */}
                        {journeyRoute && (
                            <Polyline 
                                positions={journeyRoute} 
                                color={
                                    planId === 'routeA' ? '#10b981' : // Green
                                    planId === 'routeB' ? '#8b5cf6' : // Purple
                                    '#1e293b' // Dark Navy (Pioneer)
                                } 
                                weight={5} 
                                opacity={0.85} 
                                dashArray="5, 10" 
                            />
                        )}

                        {/* Attraction Markers (blue) */}
                        {attractionMarkers.map((att, i) => (
                            <Marker key={`att-new-${i}`} position={[att.lat, att.lon]} icon={createCustomIcon('#3b82f6', '★')}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Local Attraction</div>
                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{att.name}</h4>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Nearby Famous Destinations (theme-colored markers) */}
                        {nearbyMarkers.map((nb, i) => (
                            <Marker 
                                key={`nb-${i}`} 
                                position={[nb.lat, nb.lon]} 
                                icon={createCustomIcon(
                                    planId === 'routeA' ? '#10b981' : // Green
                                    planId === 'routeB' ? '#8b5cf6' : // Purple
                                    '#1e293b', // Dark Navy
                                    '★'
                                )}
                            >
                                <Popup>
                                    <div className="p-2 w-[180px] flex flex-col gap-2">
                                        {nb.imageSrc && (
                                            <div className="h-20 w-full overflow-hidden rounded-lg bg-slate-900 shadow-sm shrink-0">
                                                <img src={nb.imageSrc} alt={nb.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${
                                                planId === 'routeA' ? 'text-emerald-600' :
                                                planId === 'routeB' ? 'text-purple-600' :
                                                'text-slate-800'
                                            }`}>{nb.theme || 'Nearby Spot'}</div>
                                            <h4 className="font-black text-slate-800 text-xs leading-snug mb-1 line-clamp-2">{nb.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold mb-2.5">{nb.city}</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewPlace(nb); }}
                                                className={`w-full transition-colors text-[9px] font-black uppercase py-2 rounded-xl text-center ${
                                                    planId === 'routeA' ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white' :
                                                    planId === 'routeB' ? 'bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white' :
                                                    'bg-slate-100 hover:bg-slate-800 text-slate-800 hover:text-white'
                                                }`}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Famous Stops Between Route (theme-colored markers) */}
                        {routeStopsMarkers.map((stop, i) => (
                            <Marker 
                                key={`stop-${i}`} 
                                position={[stop.lat, stop.lon]} 
                                icon={createCustomIcon(
                                    planId === 'routeA' ? '#10b981' : // Green
                                    planId === 'routeB' ? '#8b5cf6' : // Purple
                                    '#1e293b', // Dark Navy
                                    '★'
                                )}
                            >
                                <Popup>
                                    <div className="p-2 w-[180px] flex flex-col gap-2">
                                        {stop.imageSrc && (
                                            <div className="h-20 w-full overflow-hidden rounded-lg bg-slate-900 shadow-sm shrink-0">
                                                <img src={stop.imageSrc} alt={stop.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${
                                                planId === 'routeA' ? 'text-emerald-600' :
                                                planId === 'routeB' ? 'text-purple-600' :
                                                'text-slate-800'
                                            }`}>{stop.theme || 'Famous Stop'}</div>
                                            <h4 className="font-black text-slate-800 text-xs leading-snug mb-1 line-clamp-2">{stop.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold mb-2.5">{stop.city}</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewPlace(stop); }}
                                                className={`w-full transition-colors text-[9px] font-black uppercase py-2 rounded-xl text-center ${
                                                    planId === 'routeA' ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white' :
                                                    planId === 'routeB' ? 'bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white' :
                                                    'bg-slate-100 hover:bg-slate-800 text-slate-800 hover:text-white'
                                                }`}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                     </MapContainer>
                )}
            </div>
          </div>
        </div>
      </div>

      <ImagePreviewModal 
          isOpen={!!previewPlace}
          place={previewPlace}
          onClose={() => setPreviewPlace(null)}
      />
    </div>
  );
};

export default PlanDetails;
