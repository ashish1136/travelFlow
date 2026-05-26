import { grokService } from './grokService';
import { unsplashService } from './unsplashService';
import { locationService } from './locationService';
import { famousIndianStops } from '../data/famousIndianStops';
import { premiumRouteStops } from '../data/premiumRouteStops';
import { famousIndianCorridors } from '../data/famousIndianCorridors';
import axios from './apiClient';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const OTM_API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY || '';

/**
 * Calculates the geodesic distance between two coordinate points in kilometers (Haversine formula).
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the minimum distance from a landmark point to a polyline route path.
 */
function minDistanceToRoute(stopLat, stopLon, routeCoords) {
  if (!routeCoords || routeCoords.length === 0) return 0;
  let minD = Infinity;
  for (const coord of routeCoords) {
    let rLat, rLon;
    if (Array.isArray(coord)) {
      rLat = coord[0];
      rLon = coord[1];
    } else {
      rLat = coord.lat;
      rLon = coord.lon;
    }
    
    if (typeof rLat !== 'number' || typeof rLon !== 'number') continue;
    
    const d = getHaversineDistance(stopLat, stopLon, rLat, rLon);
    if (d < minD) {
      minD = d;
    }
  }
  return minD === Infinity ? 0 : minD;
}

function getClosestRoutePointIndex(stopLat, stopLon, routeCoords) {
  if (!routeCoords || routeCoords.length === 0) return 0;
  let minD = Infinity;
  let closestIndex = 0;
  for (let i = 0; i < routeCoords.length; i++) {
    const coord = routeCoords[i];
    let rLat, rLon;
    if (Array.isArray(coord)) {
      rLat = coord[0];
      rLon = coord[1];
    } else {
      rLat = coord.lat;
      rLon = coord.lon;
    }
    
    if (typeof rLat !== 'number' || typeof rLon !== 'number') continue;
    
    const d = getHaversineDistance(stopLat, stopLon, rLat, rLon);
    if (d < minD) {
      minD = d;
      closestIndex = i;
    }
  }
  return closestIndex;
}
/**
 * Normalizes an attraction name to prevent duplicates
 */
function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(shri|sri|temple|mandir|masjid|church|monastery|gurudwara|dargah|corridor|gate|landmark|attraction|monument|ruins|palace|fort|battle|memorial|park|sanctuary)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const CITY_CODE_MAP = {
  "del": "delhi",
  "bom": "mumbai",
  "blr": "bangalore",
  "bengaluru": "bangalore",
  "maa": "chennai",
  "ccu": "kolkata",
  "hyd": "hyderabad",
  "pnq": "pune",
  "goi": "goa",
  "pat": "patna",
  "ixc": "chandigarh",
  "agr": "agra",
  "jai": "jaipur",
  "jod": "jodhpur"
};

function normalizeCityName(name) {
  if (!name) return "";
  let clean = name.toLowerCase().trim();
  if (CITY_CODE_MAP[clean]) {
    clean = CITY_CODE_MAP[clean];
  }
  return clean;
}

/**
 * Samples checkpoints along a polyline route geometry every 20 to 30 km.
 */
function sampleRouteCheckpoints(routePoints, minSpacingKm = 20, maxSpacingKm = 30) {
  if (!routePoints || routePoints.length === 0) return [];
  
  const checkpoints = [];
  let accumulatedDistance = 0;
  let lastPoint = routePoints[0];
  
  checkpoints.push(lastPoint);

  for (let i = 1; i < routePoints.length - 1; i++) {
    const currentPoint = routePoints[i];
    let lat1, lon1, lat2, lon2;
    if (Array.isArray(lastPoint)) {
      lat1 = lastPoint[0]; lon1 = lastPoint[1];
    } else {
      lat1 = lastPoint.lat; lon1 = lastPoint.lon;
    }
    if (Array.isArray(currentPoint)) {
      lat2 = currentPoint[0]; lon2 = currentPoint[1];
    } else {
      lat2 = currentPoint.lat; lon2 = currentPoint.lon;
    }

    const dist = getHaversineDistance(lat1, lon1, lat2, lon2);
    accumulatedDistance += dist;

    if (accumulatedDistance >= minSpacingKm && accumulatedDistance <= maxSpacingKm * 1.5) {
      checkpoints.push(currentPoint);
      accumulatedDistance = 0; // reset
    } else if (accumulatedDistance > maxSpacingKm * 1.5) {
      checkpoints.push(currentPoint);
      accumulatedDistance = 0;
    }
    lastPoint = currentPoint;
  }
  
  if (routePoints.length > 1) {
    checkpoints.push(routePoints[routePoints.length - 1]);
  }

  return checkpoints;
}

let currentSessionKey = "";
const allocatedPlacesSession = new Set();

function checkAndResetSession(source, destination) {
  const normSrc = (source || "").toLowerCase().trim();
  const normDest = (destination || "").toLowerCase().trim();
  const key = `${normSrc}➔${normDest}`;
  if (currentSessionKey !== key) {
    console.log(`[Global Lock] Resetting session lock for new route: ${key}`);
    allocatedPlacesSession.clear();
    currentSessionKey = key;
  }
}

function isPlaceLocked(name) {
  if (!name) return true;
  const norm = normalizeName(name);
  return allocatedPlacesSession.has(norm);
}

function lockPlace(name) {
  if (!name) return;
  const norm = normalizeName(name);
  if (norm) {
    allocatedPlacesSession.add(norm);
  }
}

/**
 * Smart Direction-Vector Betweenness Geodesic Validator.
 * Returns true if the place lies naturally along the travel direction.
 */
/**
 * Dynamic Travel Corridor Validator.
 * Returns true if the place lies geographically between source and destination, and is within trip-length-based detour bounds.
 */
export function isPlaceWithinTravelCorridor(sourceCoords, destCoords, placeCoords, routePoints) {
  if (!sourceCoords || !destCoords || !placeCoords) return false;
  
  const sLat = parseFloat(sourceCoords.lat || sourceCoords[0]);
  const sLon = parseFloat(sourceCoords.lon || sourceCoords[1]);
  const dLat = parseFloat(destCoords.lat || destCoords[0]);
  const dLon = parseFloat(destCoords.lon || destCoords[1]);
  const pLat = parseFloat(placeCoords.lat || placeCoords.latitude);
  const pLon = parseFloat(placeCoords.lon || placeCoords.longitude);

  if (isNaN(sLat) || isNaN(sLon) || isNaN(dLat) || isNaN(dLon) || isNaN(pLat) || isNaN(pLon)) return false;

  // 1. Calculate trip distance
  const tripDistanceKm = getHaversineDistance(sLat, sLon, dLat, dLon);

  // 2. Determine allowed detour radius based on trip distance
  let allowedDetourRadius = 40;
  if (tripDistanceKm >= 300 && tripDistanceKm <= 800) {
    allowedDetourRadius = 80;
  } else if (tripDistanceKm > 800) {
    allowedDetourRadius = 120;
  }

  // 3. Bounding box check with padding based on allowed detour radius (1 degree ≈ 111 km)
  const paddingDeg = (allowedDetourRadius + 30) / 111;
  const minLat = Math.min(sLat, dLat) - paddingDeg;
  const maxLat = Math.max(sLat, dLat) + paddingDeg;
  const minLon = Math.min(sLon, dLon) - paddingDeg;
  const maxLon = Math.max(sLon, dLon) + paddingDeg;

  const inBBox = (pLat >= minLat && pLat <= maxLat && pLon >= minLon && pLon <= maxLon);
  if (!inBBox) return false;

  // 4. Directional progression (Haversine ratio check to prevent backtracking)
  const dSourceToPlace = getHaversineDistance(sLat, sLon, pLat, pLon);
  const dPlaceToDest = getHaversineDistance(pLat, pLon, dLat, dLon);
  const maxAllowedCorridorDist = tripDistanceKm + (2.2 * allowedDetourRadius);
  const inDirection = (dSourceToPlace + dPlaceToDest) <= maxAllowedCorridorDist;
  if (!inDirection) return false;

  // 5. Verify detour distance to the route polyline
  let distToRoute = 0;
  if (routePoints && routePoints.length > 0) {
    distToRoute = minDistanceToRoute(pLat, pLon, routePoints);
  } else {
    // Fallback: check distance to checkpoints along straight line
    const checkpoints = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      checkpoints.push([
        sLat + (dLat - sLat) * r,
        sLon + (dLon - sLon) * r
      ]);
    }
    let minD = Infinity;
    for (const ch of checkpoints) {
      const d = getHaversineDistance(pLat, pLon, ch[0], ch[1]);
      if (d < minD) minD = d;
    }
    distToRoute = minD;
  }

  return distToRoute <= allowedDetourRadius;
}

/**
 * Strict Nominal Cleaners to filter out fake NH checkpoints, tolls, unnamed places, and route points.
 */
function isRealTouristDestination(name, categories = []) {
  if (!name || name.trim().length < 3) return false;
  
  const rawName = name.toLowerCase();
  
  const genericKeywords = [
    'highway', 'road', 'route', 'toll', 'bypass', 'checkpoint', 'scenic halt', 'unnamed', 
    'transit', 'fuel', 'bus stand', 'railway crossing', 'nh ', 'sh ', 'station', 'lane', 
    'terminal', 'crossing', 'junction', 'flyover', 'bridge', 'plaza', 'stop', 'halt', 
    'police station', 'hospital', 'building', 'unnamed road', 'national highway'
  ];
  if (genericKeywords.some(kw => rawName.includes(kw))) {
    return false;
  }

  const badCats = ['shorthand', 'transit', 'route', 'checkpoint', 'station', 'toll', 'bus', 'railway'];
  if (categories && categories.some(cat => badCats.some(bc => cat.toLowerCase().includes(bc)))) {
    return false;
  }

  return true;
}

/**
 * Strict Allowed Categories filter.
 */
function isAllowedCategory(place) {
  const allowed = [
    'heritage', 'tourism', 'historic', 'temple', 'pilgrimage', 'cultural', 'unesco', 
    'fort', 'palace', 'hill station', 'hill_station', 'monument', 'nature', 'museum', 
    'spiritual', 'architecture', 'monastery', 'church', 'mosque', 'dargah', 'gurudwara', 
    'castle', 'tomb', 'mausoleum', 'shrine', 'sanctuary', 'national_park', 'park', 'natural'
  ];
  
  const categories = place.categories || [];
  const rawName = place.name.toLowerCase();

  const matchCategory = categories.some(cat => 
    allowed.some(ac => cat.toLowerCase().includes(ac.replace(' ', '_')))
  );

  const matchName = allowed.some(ac => rawName.includes(ac));

  return matchCategory || matchName;
}

// Flat pool of all curated verified landmarks across famousIndianStops and premiumRouteStops
const flatCuratedStops = [];
const seenNamesPool = new Set();

// Gather from premiumRouteStops
Object.values(premiumRouteStops).forEach(route => {
  if (route.famousStops) {
    route.famousStops.forEach(stop => {
      const norm = stop.name.toLowerCase().trim();
      if (!seenNamesPool.has(norm)) {
        seenNamesPool.add(norm);
        flatCuratedStops.push({
          name: stop.name,
          city: stop.city,
          state: stop.state || "",
          lat: stop.lat,
          lon: stop.lng || stop.lon,
          category: stop.category || "Heritage Site",
          theme: stop.theme || "Heritage",
          popularity: stop.popularity || 90,
          whyVisit: stop.whyVisit || stop.reason,
          exactAddress: stop.exactAddress || stop.formattedLocation,
          wikipedia: stop.wikipedia || "",
          userRatings: stop.userRatings || 4.7
        });
      }
    });
  }
});

// Gather from famousIndianStops
Object.values(famousIndianStops).forEach(stopsList => {
  stopsList.forEach(stop => {
    const norm = stop.name.toLowerCase().trim();
    if (!seenNamesPool.has(norm)) {
      seenNamesPool.add(norm);
      flatCuratedStops.push({
        name: stop.name,
        city: stop.city,
        state: stop.state || "",
        lat: stop.lat,
        lon: stop.lon || stop.lng,
        category: stop.category || stop.type || "Attraction",
        theme: stop.theme || (stop.isReligious ? "Spiritual" : stop.isHistoric ? "Heritage" : "Scenic"),
        popularity: stop.popularity || stop.popularityScore || 90,
        whyVisit: stop.reason || stop.whyVisit,
        exactAddress: stop.formattedLocation || `${stop.name}, ${stop.city}`,
        wikipedia: stop.wikipedia || "",
        userRatings: stop.userRatings || 4.7
      });
    }
  });
});

/**
 * Calculates the exact Smart Tourism scoring.
 * Detour proximity favors 30-80 km (NOT 0 km highway nodes).
 */
function computeSmartTourismScore(place, distToPoly) {
  let proximityFactor = 0;
  if (distToPoly >= 30 && distToPoly <= 80) {
    proximityFactor = 1.0;
  } else if (distToPoly < 30) {
    proximityFactor = 0.7 + (distToPoly / 30) * 0.3; // 0.7 at 0km to 1.0 at 30km
  } else if (distToPoly > 80 && distToPoly <= 120) {
    proximityFactor = 1.0 - ((distToPoly - 80) / 40); // 1.0 at 80km to 0.0 at 120km
  } else {
    proximityFactor = 0;
  }
  const routeProximityScore = proximityFactor * 100 * 0.15;

  const popularity = place.popularity || place.rank || place.popularityScore || 75;
  const popularityScore = popularity * 0.35;

  const hasWiki = !!(place.wikipedia || (place.wikipedia && place.wikipedia.length > 0));
  const wikipediaScore = (hasWiki ? 100 : 0) * 0.20;

  const userRating = place.userRatings || 4.5;
  const reviewScore = (userRating / 5 * 100) * 0.20;

  const hasImage = !!(place.image || place.imageSrc || place.imageQuery);
  const imageQualityScore = (hasImage ? 100 : 50) * 0.10;

  return popularityScore + wikipediaScore + reviewScore + routeProximityScore + imageQualityScore;
}

/**
 * Filter and score Cultural Explorer (routeA) candidates.
 */
function filterCulturalPlace(place, routePoints, sourceCoords, destCoords) {
  if (!isRealTouristDestination(place.name, place.categories)) return { isValid: false };
  if (!isAllowedCategory(place)) return { isValid: false };
  if (isPlaceLocked(place.name)) return { isValid: false };

  const rawName = place.name.toLowerCase();

  // Strict Cultural Rejections
  const culturalRejections = [
    'mountain', 'forest', 'wilderness', 'hiking', 'camping', 'trekking', 'waterfall', 
    'valley', 'hill_station', 'wildlife', 'safari'
  ];
  if ((place.categories || []).some(cat => culturalRejections.some(cr => cat.toLowerCase().includes(cr))) ||
      culturalRejections.some(cr => rawName.includes(cr))) {
    return { isValid: false };
  }

  let distToPoly = 0;
  if (routePoints && routePoints.length > 0) {
    distToPoly = minDistanceToRoute(place.lat, place.lon, routePoints);
  }

  // Dynamic Travel Corridor check
  if (sourceCoords && destCoords) {
    const inCorridor = isPlaceWithinTravelCorridor(sourceCoords, destCoords, place, routePoints);
    if (!inCorridor) return { isValid: false };
  }

  const score = computeSmartTourismScore(place, distToPoly);

  return {
    isValid: true,
    score: score,
    theme: place.theme || "Cultural",
    category: place.category || "Cultural Landmark",
    distToPoly: distToPoly
  };
}

/**
 * Filter and score Heritage Path (routeB) candidates.
 */
function filterHeritagePlace(place, routePoints, sourceCoords, destCoords) {
  if (!isRealTouristDestination(place.name, place.categories)) return { isValid: false };
  if (!isAllowedCategory(place)) return { isValid: false };
  if (isPlaceLocked(place.name)) return { isValid: false };

  const rawName = place.name.toLowerCase();

  // Reject commercial, nightlife, resorts
  const heritageRejections = [
    'cafe', 'nightlife', 'bar', 'club', 'pub', 'cinema', 'casino', 'amusement', 'commercial', 'shopping'
  ];
  if (heritageRejections.some(kw => rawName.includes(kw)) ||
      (place.categories || []).some(cat => ['shopping', 'entertainment.nightlife', 'catering.cafe'].some(hr => cat.toLowerCase().includes(hr)))) {
    return { isValid: false };
  }

  let distToPoly = 0;
  if (routePoints && routePoints.length > 0) {
    distToPoly = minDistanceToRoute(place.lat, place.lon, routePoints);
  }

  // Dynamic Travel Corridor check
  if (sourceCoords && destCoords) {
    const inCorridor = isPlaceWithinTravelCorridor(sourceCoords, destCoords, place, routePoints);
    if (!inCorridor) return { isValid: false };
  }

  const score = computeSmartTourismScore(place, distToPoly);

  return {
    isValid: true,
    score: score,
    theme: place.theme || "Heritage",
    category: place.category || "Historical Landmark",
    distToPoly: distToPoly
  };
}

/**
 * Filter and score Pioneer Trail (routeC) candidates.
 */
function filterPioneerPlace(place, routePoints, sourceCoords, destCoords) {
  if (!isRealTouristDestination(place.name, place.categories)) return { isValid: false };
  if (!isAllowedCategory(place)) return { isValid: false };
  if (isPlaceLocked(place.name)) return { isValid: false };

  const rawName = place.name.toLowerCase();

  // Reject crowded urban spaces, museums, malls, entertainment
  const pioneerRejections = [
    'museum', 'city_center', 'shopping', 'entertainment', 'theatre', 'exhibition', 'gallery'
  ];
  if (pioneerRejections.some(kw => rawName.includes(kw)) ||
      (place.categories || []).some(cat => ['entertainment.culture', 'tourism.attraction.exhibition'].some(pr => cat.toLowerCase().includes(pr)))) {
    return { isValid: false };
  }

  let distToPoly = 0;
  if (routePoints && routePoints.length > 0) {
    distToPoly = minDistanceToRoute(place.lat, place.lon, routePoints);
  }

  // Dynamic Travel Corridor check
  if (sourceCoords && destCoords) {
    const inCorridor = isPlaceWithinTravelCorridor(sourceCoords, destCoords, place, routePoints);
    if (!inCorridor) return { isValid: false };
  }

  const score = computeSmartTourismScore(place, distToPoly);

  return {
    isValid: true,
    score: score,
    theme: place.theme || "Scenic",
    category: place.category || "Scenic Hotspot",
    distToPoly: distToPoly
  };
}

export const routeTourismService = {
  /**
   * Upgraded strict stops generation with precise detour corridor validation and flat pool search.
   */
  getStopsAlongRoute: async (source, destination, routePoints = [], planId = 'routeA') => {
    console.log(`[Smart Tourism Engine v4] Resolving stops: ${source} ➔ ${destination} (Selected Plan: ${planId})`);
    unsplashService.clearCache();
    
    // Initialize session checking
    checkAndResetSession(source, destination);

    const srcNorm = normalizeCityName(source);
    const destNorm = normalizeCityName(destination);

    let sourceCoords = null, destCoords = null;
    try {
      sourceCoords = await locationService.getCoordinates(source);
      destCoords = await locationService.getCoordinates(destination);
    } catch (e) {
      console.warn("Geocoding endpoints failed:", e.message);
    }

    // Fallback to route points if geocoding failed
    if ((!sourceCoords || !destCoords) && routePoints && routePoints.length > 0) {
      const startPt = routePoints[0];
      const endPt = routePoints[routePoints.length - 1];
      if (!sourceCoords && startPt) {
        let lat = 0, lon = 0;
        if (Array.isArray(startPt)) {
          lat = startPt[0];
          lon = startPt[1];
        } else {
          lat = startPt.lat;
          lon = startPt.lon;
        }
        if (typeof lat === 'number' && typeof lon === 'number') {
          sourceCoords = { lat, lon, formatted: source };
        }
      }
      if (!destCoords && endPt) {
        let lat = 0, lon = 0;
        if (Array.isArray(endPt)) {
          lat = endPt[0];
          lon = endPt[1];
        } else {
          lat = endPt.lat;
          lon = endPt.lon;
        }
        if (typeof lat === 'number' && typeof lon === 'number') {
          destCoords = { lat, lon, formatted: destination };
        }
      }
    }

    const tripDistanceKm = (sourceCoords && destCoords)
      ? getHaversineDistance(sourceCoords.lat, sourceCoords.lon, destCoords.lat, destCoords.lon)
      : 500;

    let allowedDetourRadius = 40;
    if (tripDistanceKm >= 300 && tripDistanceKm <= 800) {
      allowedDetourRadius = 80;
    } else if (tripDistanceKm > 800) {
      allowedDetourRadius = 120;
    }

    const finalCandidates = [];
    const seenNames = new Set();

    // Helper to add candidate safely (deduplicated by name normalization)
    const addCandidate = (p, score, distVal, formattedLoc, reasonText) => {
      const norm = normalizeName(p.name);
      if (!seenNames.has(norm)) {
        seenNames.add(norm);
        finalCandidates.push({
          name: p.name,
          city: p.city,
          formattedLocation: formattedLoc || p.formattedLocation || p.exactAddress || `${p.name}, ${p.city}, India`,
          lat: p.lat || p.latitude,
          lon: p.lon || p.lng || p.longitude,
          distanceFromRouteValue: distVal,
          category: p.category || p.theme || "Attraction",
          theme: p.theme || (planId === 'routeA' ? "Cultural" : (planId === 'routeB' ? "Heritage" : "Scenic")),
          popularityScore: p.popularityScore || p.popularity || 85,
          reason: reasonText || p.whyVisit || p.reason || "An iconic regional landmark capturing tourist interest annually.",
          tourismScore: score
        });
      }
    };

    // ==========================================
    // LEVEL 1: CHECK PREMIUM STATIC CORRIDORS DATABASE
    // ==========================================
    const corridorKey = Object.keys(famousIndianCorridors).find(k => {
      const parts = k.split('-');
      const matchPart = (input, part) => {
        const normInput = input.toLowerCase().trim();
        const normPart = part.toLowerCase().trim();
        return normInput === normPart || 
               normInput.includes(normPart) || 
               normPart.includes(normInput) ||
               (normInput.length >= 3 && normPart.startsWith(normInput)) ||
               (normPart.length >= 3 && normInput.startsWith(normPart));
      };
      return (matchPart(srcNorm, parts[0]) && matchPart(destNorm, parts[1])) ||
             (matchPart(srcNorm, parts[1]) && matchPart(destNorm, parts[0]));
    });

    if (corridorKey) {
      console.log(`[Smart Tourism Engine v4] Level 1 Match found in premium static corridor database: ${corridorKey}`);
      const corridorData = famousIndianCorridors[corridorKey];
      const stops = corridorData.famousStops || [];

      // Filter matched stops by current planId theme first
      let matchedStops = [];
      if (planId === 'routeA') {
        matchedStops = stops.filter(s => (s.theme === 'Spiritual' || s.theme === 'Cultural') && !isPlaceLocked(s.name));
      } else if (planId === 'routeB') {
        matchedStops = stops.filter(s => (s.theme === 'Historical' || s.theme === 'Heritage') && !isPlaceLocked(s.name));
      } else if (planId === 'routeC') {
        matchedStops = stops.filter(s => (s.theme === 'Scenic' || s.theme === 'Adventure') && !isPlaceLocked(s.name));
      }

      // If fewer than 3 plan-specific stops found in curated, grab other stops from this curated corridor
      if (matchedStops.length < 3) {
        const remainingCurated = stops.filter(s => !matchedStops.some(m => m.name === s.name) && !isPlaceLocked(s.name));
        matchedStops = [...matchedStops, ...remainingCurated];
      }

      for (const p of matchedStops) {
        const lat = p.lat;
        const lon = p.lng || p.lon;
        
        let dist = 0;
        if (routePoints && routePoints.length > 0) {
          dist = minDistanceToRoute(lat, lon, routePoints);
        } else if (sourceCoords) {
          dist = getHaversineDistance(lat, lon, sourceCoords.lat, sourceCoords.lon);
        }
        
        const score = computeSmartTourismScore(p, dist);
        addCandidate(p, score, dist, p.exactAddress, p.whyVisit);
      }
    }

    // ==========================================
    // LEVEL 2: DYNAMIC EXPERIENCE CORRIDOR SEARCH (Geoapify/OpenTripMap + Flat Curated Sights Pool)
    // ==========================================
    // We run Level 2 if candidates are sparse (less than 4) OR if no premium corridor was found
    if (finalCandidates.length < 6) {
      console.log(`[Smart Tourism Engine v4] Level 2 Corridor check: ${allowedDetourRadius} km...`);

      // A. Scan Flat Curated Pool
      for (const landmark of flatCuratedStops) {
        if (isPlaceLocked(landmark.name)) continue;

        let dist = 0;
        if (routePoints && routePoints.length > 0) {
          dist = minDistanceToRoute(landmark.lat, landmark.lon, routePoints);
        } else if (sourceCoords) {
          dist = getHaversineDistance(landmark.lat, landmark.lon, sourceCoords.lat, sourceCoords.lon);
        }

        if (dist <= allowedDetourRadius) {
          let filterRes = { isValid: false };
          if (planId === 'routeA') {
            filterRes = filterCulturalPlace(landmark, routePoints, sourceCoords, destCoords);
          } else if (planId === 'routeB') {
            filterRes = filterHeritagePlace(landmark, routePoints, sourceCoords, destCoords);
          } else if (planId === 'routeC') {
            filterRes = filterPioneerPlace(landmark, routePoints, sourceCoords, destCoords);
          }

          if (filterRes.isValid) {
            addCandidate(landmark, filterRes.score, dist, landmark.exactAddress, landmark.whyVisit);
          }
        }
      }

      // B. Query Dynamic APIs
      let checkpoints = [];
      if (routePoints && routePoints.length > 0) {
        checkpoints = sampleRouteCheckpoints(routePoints, 25, 40);
      } else if (sourceCoords && destCoords) {
        const directDist = getHaversineDistance(sourceCoords.lat, sourceCoords.lon, destCoords.lat, destCoords.lon);
        const steps = Math.max(4, Math.round(directDist / 35));
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          checkpoints.push({
            lat: sourceCoords.lat + (destCoords.lat - sourceCoords.lat) * ratio,
            lon: sourceCoords.lon + (destCoords.lon - sourceCoords.lon) * ratio
          });
        }
      }

      const apiCheckpoints = checkpoints.filter((_, idx) => idx % Math.max(1, Math.round(checkpoints.length / 10)) === 0);
      for (const ch of apiCheckpoints) {
        let lat = ch.lat || ch[0];
        let lon = ch.lon || ch[1];
        if (!lat || !lon) continue;

        try {
          let apiPlaces = [];
          if (OTM_API_KEY) {
            const otmUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${allowedDetourRadius * 1000}&lon=${lon}&lat=${lat}&kinds=historic,architecture,cultural,religion,museums,forts,castles,monasteries,national_parks&rate=2&format=json&limit=6&apikey=${OTM_API_KEY}`;
            const res = await axios.get(otmUrl);
            if (res.data && Array.isArray(res.data)) {
              apiPlaces = res.data.map(p => ({
                name: p.name,
                lat: p.point.lat,
                lon: p.point.lon,
                categories: p.kinds ? p.kinds.split(',') : [],
                rank: p.rate || 2,
                city: p.name ? p.name.split(' ')[0] : 'Attraction',
                wikipedia: p.wikipedia || '',
                image: p.image || ''
              }));
            }
          } else if (GEOAPIFY_KEY) {
            const categories = 'tourism.attraction,heritage,entertainment.culture,leisure.park';
            const geoUrl = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${allowedDetourRadius * 1000}&bias=proximity:${lon},${lat}&limit=6&apiKey=${GEOAPIFY_KEY}`;
            const res = await axios.get(geoUrl);
            if (res.data && res.data.features) {
              apiPlaces = res.data.features
                .filter(f => f.properties && f.properties.name)
                .map(f => {
                  const props = f.properties;
                  return {
                    name: props.name,
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0],
                    categories: props.categories || [],
                    rank: props.popularity || 70,
                    city: props.city || props.name.split(' ')[0],
                    wikipedia: props.wiki_and_media?.wikipedia || '',
                    image: props.wiki_and_media?.image || '',
                    formattedAddress: props.formatted
                  };
                });
            }
          }

          for (const place of apiPlaces) {
            if (isPlaceLocked(place.name)) continue;

            let dist = 0;
            if (routePoints && routePoints.length > 0) {
              dist = minDistanceToRoute(place.lat, place.lon, routePoints);
            } else {
              dist = getHaversineDistance(place.lat, place.lon, lat, lon);
            }

            if (dist <= allowedDetourRadius) {
              let filterRes = { isValid: false };
              if (planId === 'routeA') {
                filterRes = filterCulturalPlace(place, routePoints, sourceCoords, destCoords);
              } else if (planId === 'routeB') {
                filterRes = filterHeritagePlace(place, routePoints, sourceCoords, destCoords);
              } else if (planId === 'routeC') {
                filterRes = filterPioneerPlace(place, routePoints, sourceCoords, destCoords);
              }

              if (filterRes.isValid) {
                // Prevent duplicate markers sitting extremely close to each other
                let isTooClose = false;
                for (const cand of finalCandidates) {
                  const d = getHaversineDistance(place.lat, place.lon, cand.lat, cand.lon);
                  if (d < 5.0) {
                    isTooClose = true;
                    break;
                  }
                }
                if (isTooClose) continue;

                addCandidate(
                  place,
                  filterRes.score,
                  dist,
                  place.formattedAddress,
                  `A highly renowned ${filterRes.theme.toLowerCase()} tourism landmark located along the travel corridor.`
                );
              }
            }
          }
        } catch (apiErr) {
          console.warn(`API query failed along corridor:`, apiErr.message);
        }
      }
    }

    // ==========================================
    // ==========================================
    // LEVEL 3: ROBUST AUTO-FILL BACKUPS (NEVER LESS THAN 3 CARDS)
    // ==========================================
    if (finalCandidates.length < 3) {
      console.log(`[Smart Tourism Engine v4] Level 3 Fallback triggered. Candidates count: ${finalCandidates.length}`);
      
      // A. Pull from the Flat pool of curated verified sights that lie geographically "between"
      for (const landmark of flatCuratedStops) {
        if (finalCandidates.length >= 3) break;

        let dist = 0;
        if (routePoints && routePoints.length > 0) {
          dist = minDistanceToRoute(landmark.lat, landmark.lon, routePoints);
        } else if (sourceCoords) {
          dist = getHaversineDistance(landmark.lat, landmark.lon, sourceCoords.lat, sourceCoords.lon);
        }

        // Relaxed threshold: check if is within trip corridor
        if (sourceCoords && destCoords) {
          const inCorridor = isPlaceWithinTravelCorridor(sourceCoords, destCoords, landmark, routePoints);
          if (inCorridor) {
            const score = computeSmartTourismScore(landmark, dist);
            addCandidate(landmark, score, dist, landmark.exactAddress, landmark.whyVisit);
          }
        }
      }

      // B. If still less than 3, pull directly from the experience failsafe highway stops if they lie near the route/corridor
      if (finalCandidates.length < 3) {
        console.log(`[Smart Tourism Engine v4] Level 3 Failsafe inject triggered.`);
        const failsafes = failsafeIndianHighwayStops[planId] || failsafeIndianHighwayStops['routeA'];
        for (const stop of failsafes) {
          if (finalCandidates.length >= 3) break;
          
          let dist = 0;
          if (routePoints && routePoints.length > 0) {
            dist = minDistanceToRoute(stop.lat, stop.lon, routePoints);
          } else if (sourceCoords) {
            dist = getHaversineDistance(stop.lat, stop.lon, sourceCoords.lat, sourceCoords.lon);
          }

          if (sourceCoords && destCoords) {
            const inCorridor = isPlaceWithinTravelCorridor(sourceCoords, destCoords, stop, routePoints);
            if (inCorridor) {
              const score = computeSmartTourismScore(stop, dist);
              addCandidate(stop, score, dist, stop.formattedLocation, stop.reason);
            }
          }
        }
      }
      
      // C. Absolute non-route backup filler is disabled to ensure only places near the route are suggested.
    }

    // Segment candidates geographically (Start, Middle, End) based on closest route index
    const startGroup = [];
    const middleGroup = [];
    const endGroup = [];

    for (const cand of finalCandidates) {
      let idx = 0;
      if (routePoints && routePoints.length > 0) {
        idx = getClosestRoutePointIndex(cand.lat, cand.lon, routePoints);
      }
      
      const N = routePoints ? routePoints.length : 0;
      if (N === 0) {
        let sourceDist = sourceCoords ? getHaversineDistance(cand.lat, cand.lon, sourceCoords.lat, sourceCoords.lon) : 0;
        let destDist = destCoords ? getHaversineDistance(cand.lat, cand.lon, destCoords.lat, destCoords.lon) : 0;
        if (sourceDist < destDist * 0.5) {
          startGroup.push(cand);
        } else if (sourceDist > destDist * 1.5) {
          endGroup.push(cand);
        } else {
          middleGroup.push(cand);
        }
      } else {
        const seg1 = Math.floor(N / 3);
        const seg2 = Math.floor(2 * N / 3);
        if (idx <= seg1) {
          startGroup.push(cand);
        } else if (idx <= seg2) {
          middleGroup.push(cand);
        } else {
          endGroup.push(cand);
        }
      }
    }

    startGroup.sort((a, b) => b.tourismScore - a.tourismScore);
    middleGroup.sort((a, b) => b.tourismScore - a.tourismScore);
    endGroup.sort((a, b) => b.tourismScore - a.tourismScore);

    const chosenStops = [];
    // Select up to 2 from each geographical segment to guarantee beautiful distribution
    chosenStops.push(...startGroup.slice(0, 2), ...middleGroup.slice(0, 2), ...endGroup.slice(0, 2));

    // Fill remaining capacity if less than 6 total stops found in segments
    if (chosenStops.length < 6) {
      const remainingCandidates = [];
      const chosenNamesSet = new Set(chosenStops.map(c => normalizeName(c.name)));
      for (const cand of [...startGroup, ...middleGroup, ...endGroup]) {
        if (!chosenNamesSet.has(normalizeName(cand.name))) {
          remainingCandidates.push(cand);
        }
      }
      remainingCandidates.sort((a, b) => b.tourismScore - a.tourismScore);
      const needed = 6 - chosenStops.length;
      chosenStops.push(...remainingCandidates.slice(0, needed));
    }

    // Call dynamic Unsplash image loader and compile finalized stops
    const finalStopsList = [];
    for (const stop of chosenStops) {
      const detourLabel = stop.distanceFromRouteValue < 1 ? "Directly on your route" : `${stop.distanceFromRouteValue.toFixed(0)} km detour from your route`;
      const imageSrc = await unsplashService.getImageForPlace(`${stop.name} ${stop.city}`, stop.city);

      finalStopsList.push({
        name: stop.name,
        city: stop.city,
        formattedLocation: stop.formattedLocation,
        lat: stop.lat,
        lon: stop.lon,
        distanceFromRoute: detourLabel,
        category: stop.category,
        theme: stop.theme,
        popularityScore: stop.popularityScore,
        reason: stop.reason,
        imageSrc: imageSrc
      });
    }

    for (const s of finalStopsList) {
      lockPlace(s.name);
    }

    return finalStopsList;
  },

  /**
   * Refactored Nearby Destinations (Route and Plan specific checks)
   */
  getNearbyDestinations: async (destination, planId = 'routeA', customRadius = null) => {
    console.log(`[Smart Tourism Engine v4] Resolving nearby destinations for: ${destination} (Selected Plan: ${planId}, Custom Radius: ${customRadius})`);
    unsplashService.clearCache();

    checkAndResetSession("", destination);

    const destNorm = (destination || '').toLowerCase().trim();

    // 1. Plan-specific parameters
    let scanRadiusKm = 50;
    let allowedCategories = [];
    let defaultTheme = "Cultural";
    let defaultCategory = "Cultural Landmark";

    if (planId === 'routeA') { // Cultural Explorer
      scanRadiusKm = 50;
      allowedCategories = ['museum', 'heritage', 'temple', 'cultural', 'monastery', 'church', 'mosque', 'dargah', 'gurudwara', 'art', 'theatre', 'monument', 'shrine'];
      defaultTheme = "Cultural";
      defaultCategory = "Cultural Landmark";
    } else if (planId === 'routeB') { // Heritage Path
      scanRadiusKm = 100;
      allowedCategories = ['fort', 'spiritual', 'historic', 'heritage', 'castle', 'tomb', 'mausoleum', 'archaeology', 'palace', 'ruins'];
      defaultTheme = "Heritage";
      defaultCategory = "Historical Monument";
    } else if (planId === 'routeC') { // Pioneer Trail
      scanRadiusKm = 150;
      allowedCategories = ['scenic', 'wildlife', 'hill station', 'hill_station', 'nature', 'sanctuary', 'national_park', 'park', 'natural', 'waterfall', 'lake', 'mountain', 'forest', 'valley', 'camp', 'adventure'];
      defaultTheme = "Scenic";
      defaultCategory = "Scenic Hotspot";
    }

    if (customRadius !== null && !isNaN(customRadius)) {
      scanRadiusKm = Number(customRadius);
    }

    let destLat = 28.6129, destLon = 77.2295;
    const destGeo = await locationService.getCoordinates(`${destination}, India`);
    if (destGeo) {
      destLat = parseFloat(destGeo.lat);
      destLon = parseFloat(destGeo.lon);
    }

    const finalHubs = [];
    const seenNames = new Set();

    const addHub = (p, distVal, formattedLoc, imageSrcVal) => {
      const norm = normalizeName(p.name);
      if (!seenNames.has(norm) && !isPlaceLocked(p.name)) {
        seenNames.add(norm);
        finalHubs.push({
          name: p.name,
          city: p.city,
          formattedLocation: formattedLoc || p.formattedLocation || p.exactAddress || `${p.name}, ${p.city}, India`,
          lat: p.lat || p.latitude,
          lon: p.lon || p.lng || p.longitude,
          distance: `${Math.round(distVal)} km away`,
          travelTime: `${(distVal / 50).toFixed(1)} hours`,
          category: p.category || p.theme || defaultCategory,
          theme: p.theme || defaultTheme,
          popularityScore: p.popularityScore || p.popularity || 85,
          reason: p.whyVisit || p.reason || `A highly recommended nearby attraction showcasing regional tourism near ${destination}.`,
          imageSrc: imageSrcVal || ""
        });
      }
    };

    // ==========================================
    // STEP 1: CHECK PREMIUM CURATED ROUTESTOPS NEARBY
    // ==========================================
    const premiumKey = Object.keys(premiumRouteStops).find(k => {
      const parts = k.split('-');
      return parts[1] === destNorm || parts[0] === destNorm;
    });

    if (premiumKey && premiumRouteStops[premiumKey]?.nearbyDestinations) {
      const hubs = premiumRouteStops[premiumKey].nearbyDestinations;
      const matchedHubs = hubs.filter(h => h.theme === defaultTheme);
      
      for (const hub of matchedHubs) {
        try {
          const geocodeRes = await locationService.getCoordinates(`${hub.name}, India`);
          if (geocodeRes && geocodeRes.lat && geocodeRes.lon) {
            const dist = getHaversineDistance(destLat, destLon, parseFloat(geocodeRes.lat), parseFloat(geocodeRes.lon));
            if (dist <= scanRadiusKm) {
              const img = await unsplashService.getImageForPlace(`${hub.name} tourism`, hub.city);
              addHub({
                name: hub.name,
                city: hub.city,
                lat: parseFloat(geocodeRes.lat),
                lon: parseFloat(geocodeRes.lon),
                category: hub.category,
                theme: hub.theme,
                popularity: hub.popularityScore,
                whyVisit: hub.reason
              }, dist, geocodeRes.formatted, img);
            }
          }
        } catch (e) {
          console.warn(`Curated hub geocode failed:`, e.message);
        }
      }
    }

    // ==========================================
    // STEP 2: SEARCH FLAT CURATED POOL FOR THEME MATCHES
    // ==========================================
    if (finalHubs.length < 6) {
      for (const landmark of flatCuratedStops) {
        const dist = getHaversineDistance(destLat, destLon, landmark.lat, landmark.lon);
        if (dist <= scanRadiusKm) {
          // Check categories match
          const matchesCategory = allowedCategories.some(ac => 
            landmark.category.toLowerCase().includes(ac) || 
            (landmark.theme && landmark.theme.toLowerCase().includes(ac))
          );
          if (matchesCategory) {
            addHub(landmark, dist, landmark.exactAddress, null);
          }
        }
      }
    }

    // ==========================================
    // STEP 3: DYNAMIC API SCAN FOR PLAN-SPECIFIC RADII & CATEGORIES
    // ==========================================
    if (finalHubs.length < 6) {
      try {
        let rawPlaces = [];
        if (GEOAPIFY_KEY) {
          const catString = 'tourism.attraction,heritage,entertainment.culture,leisure.park';
          const maxRadius = scanRadiusKm * 1000;
          // Dynamically adjust bias and limit to find distant regional hotspots without urban crowding
          let geoUrl = '';
          if (scanRadiusKm > 80) {
            geoUrl = `https://api.geoapify.com/v2/places?categories=${catString}&filter=circle:${destLon},${destLat},${maxRadius}&limit=80&apiKey=${GEOAPIFY_KEY}`;
          } else {
            geoUrl = `https://api.geoapify.com/v2/places?categories=${catString}&filter=circle:${destLon},${destLat},${maxRadius}&bias=proximity:${destLon},${destLat}&limit=80&apiKey=${GEOAPIFY_KEY}`;
          }
          const res = await axios.get(geoUrl);
          if (res.data && res.data.features) {
            rawPlaces = res.data.features
              .filter(f => f.properties && f.properties.name)
              .map(f => {
                const props = f.properties;
                return {
                  name: props.name,
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  city: props.city || props.name.split(' ')[0],
                  categories: props.categories || [],
                  popularity: props.popularity || 85,
                  category: props.categories?.[0] || defaultCategory,
                  formatted: props.formatted,
                  wikipedia: props.wiki_and_media?.wikipedia || ''
                };
              });
          }
        }

        for (const place of rawPlaces) {
          if (finalHubs.length >= 6) break;

          const dist = getHaversineDistance(destLat, destLon, place.lat, place.lon);
          if (dist > scanRadiusKm) continue;

          const matchesCategory = place.categories.some(cat => 
            allowedCategories.some(ac => cat.toLowerCase().includes(ac))
          ) || (finalHubs.length < 6 && place.categories.some(cat => 
            ['tourism', 'sight', 'attraction', 'monument', 'cultural', 'building', 'historic'].some(ac => cat.toLowerCase().includes(ac))
          ));
          if (matchesCategory && isRealTouristDestination(place.name, place.categories)) {
            let isTooClose = false;
            for (const h of finalHubs) {
              const d = getHaversineDistance(place.lat, place.lon, h.lat, h.lon);
              if (d < 4.0) {
                isTooClose = true;
                break;
              }
            }
            if (isTooClose) continue;

            addHub({
              name: place.name,
              city: place.city,
              lat: place.lat,
              lon: place.lon,
              category: place.category,
              theme: defaultTheme,
              popularity: place.popularity
            }, dist, place.formatted, null);
          }
        }
      } catch (err) {
        console.warn("Dynamic API radius query for nearby places failed:", err.message);
      }
    }

    // ==========================================
    // STEP 4: GUARANTEED FALLBACK POPULATOR (MINIMUM 3 CARDS)
    // ==========================================
    if (finalHubs.length < 3) {
      console.log(`[Smart Tourism Engine v4] getNearbyDestinations Fallback trigger. Filling to 3.`);
      
      // Grab any landmark from the flat pool within 150 km regardless of theme
      for (const landmark of flatCuratedStops) {
        if (finalHubs.length >= 3) break;
        const dist = getHaversineDistance(destLat, destLon, landmark.lat, landmark.lon);
        if (dist <= 150) {
          addHub(landmark, dist, landmark.exactAddress, null);
        }
      }

      // If still less than 3, load absolute failsafe stops only if they are actually nearby
      if (finalHubs.length < 3) {
        const failsafes = failsafeIndianHighwayStops[planId] || failsafeIndianHighwayStops['routeA'];
        for (const stop of failsafes) {
          if (finalHubs.length >= 3) break;
          const dist = getHaversineDistance(destLat, destLon, stop.lat, stop.lon);
          if (dist <= scanRadiusKm) {
            addHub(stop, dist, stop.formattedLocation, null);
          }
        }
      }
    }

    const chosenHubs = finalHubs.sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 6);

    // Load Unsplash images for dynamically resolved hubs
    const finalHubsList = [];
    for (const hub of chosenHubs) {
      const img = hub.imageSrc || await unsplashService.getImageForPlace(`${hub.name} tourism`, hub.city);
      finalHubsList.push({
        ...hub,
        imageSrc: img
      });
    }

    // lockPlace is removed for nearby destinations to prevent interactive radius change self-lockouts

    return finalHubsList;
  }
};

/**
 * Hardcoded failsafe stops to guarantee we never return empty state
 */
const failsafeIndianHighwayStops = {
  routeA: [ // Cultural Explorer (Spiritual/Cultural)
    {
      name: "Akshardham Temple Complex",
      city: "Delhi",
      formattedLocation: "NH-24, Pramukh Swami Maharaj Marg, New Delhi, Delhi, India",
      lat: 28.6127,
      lon: 77.2773,
      distanceFromRoute: "2 km detour from your route",
      category: "Pilgrimage Site",
      theme: "Spiritual",
      popularityScore: 98,
      reason: "A colossal spiritual-cultural heritage campus displaying millennia of traditional Indian art and architecture."
    },
    {
      name: "Triveni Sangam Ghats",
      city: "Prayagraj",
      formattedLocation: "Triveni Sangam, Prayagraj, Uttar Pradesh, India",
      lat: 25.4285,
      lon: 81.8906,
      distanceFromRoute: "14 km detour from your route",
      category: "Spiritual Landmark",
      theme: "Spiritual",
      popularityScore: 96,
      reason: "The sacred confluence of the Ganges, Yamuna, and mythical Saraswati rivers, drawing millions of pilgrims yearly."
    },
    {
      name: "City Palace",
      city: "Jaipur",
      formattedLocation: "Tulsi Marg, Gangori Bazaar, Jaipur, Rajasthan, India",
      lat: 26.9258,
      lon: 75.8236,
      distanceFromRoute: "1 km detour from your route",
      category: "Iconic Attraction",
      theme: "Cultural",
      popularityScore: 95,
      reason: "A magnificent royal palace complex featuring stunning archways and courtyards inside the walled Pink City."
    }
  ],
  routeB: [ // Heritage Path (Historical/Heritage)
    {
      name: "Amer Fort Palace",
      city: "Jaipur",
      formattedLocation: "Amer Fort, Devisinghpura, Jaipur, Rajasthan, India",
      lat: 26.9855,
      lon: 75.8513,
      distanceFromRoute: "3 km detour from your route",
      category: "Historical Landmark",
      theme: "Heritage",
      popularityScore: 97,
      reason: "A grand hilltop fortress featuring detailed red sandstone structures, sweeping battlements, and the famous mirror palace."
    },
    {
      name: "Chittorgarh Fort Ruins",
      city: "Chittorgarh",
      formattedLocation: "Fort Road, Chittorgarh, Rajasthan, India",
      lat: 24.8879,
      lon: 74.6451,
      distanceFromRoute: "8 km detour from your route",
      category: "Historical Landmark",
      theme: "Heritage",
      popularityScore: 98,
      reason: "The grandest fort in India, standing as a colossal symbol of Rajput courage, sacrifice, and majestic architecture."
    },
    {
      name: "Fatehpur Sikri Imperial",
      city: "Agra",
      formattedLocation: "Fatehpur Sikri, Agra, Uttar Pradesh, India",
      lat: 27.0945,
      lon: 77.6679,
      distanceFromRoute: "11 km detour from your route",
      category: "Historical Landmark",
      theme: "Heritage",
      popularityScore: 96,
      reason: "The imperial red sandstone capital founded by Emperor Akbar, home to Buland Darwaza and Panch Mahal."
    }
  ],
  routeC: [ // Pioneer Trail (Scenic/Adventure)
    {
      name: "Kasauli Pine Hills",
      city: "Kasauli",
      formattedLocation: "Kasauli Cantonment, Solan, Himachal Pradesh, India",
      lat: 30.8996,
      lon: 76.9609,
      distanceFromRoute: "6 km detour from your route",
      category: "Scenic Hotspot",
      theme: "Scenic",
      popularityScore: 91,
      reason: "A peaceful weekend hill station offering mist-covered nature hikes, chir pine forests, and quiet overlooks."
    },
    {
      name: "Om Beach Gokarna",
      city: "Gokarna",
      formattedLocation: "Om Beach, Gokarna, Uttara Kannada, Karnataka, India",
      lat: 14.5204,
      lon: 74.3188,
      distanceFromRoute: "18 km detour from your route",
      category: "Scenic Hotspot",
      theme: "Scenic",
      popularityScore: 93,
      reason: "A peaceful coastal town featuring pristine, golden sandy beaches shaped like the spiritual Om symbol."
    },
    {
      name: "Solang Valley Adventure",
      city: "Manali",
      formattedLocation: "Solang Valley, Manali, Himachal Pradesh, India",
      lat: 32.3165,
      lon: 77.1650,
      distanceFromRoute: "4 km detour from your route",
      category: "Scenic Hotspot",
      theme: "Scenic",
      popularityScore: 95,
      reason: "A breathtaking side valley famous for snow fields, adventure sports like paragliding, and high mountains."
    }
  ]
};

/**
 * Direct call to Grok completion API strictly for travel themes, significance reasoning, and ranking
 */
async function getGrokReasonings(places, source, destination) {
  const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;
  if (!GROK_API_KEY || GROK_API_KEY.trim() === '') return null;

  try {
    const prompt = `You are a smart travel intelligence layer. We have identified these real physical places on the road trip route between "${source}" and "${destination}" in India:
    ${JSON.stringify(places)}
    
    For each place, refine and return:
    1. "reason": A short 1-2 sentence compelling travel explanation of WHY tourists visit it, its cultural significance, or why it is famous.
    2. "theme": Categorize it as exactly one of: Spiritual, Historical, Scenic, Adventure, Heritage, or Cultural.
    
    Return a JSON object in this exact format:
    {
      "reasonings": [
        {
          "name": "Exact Name of the Place",
          "reason": "Captivating travel reason",
          "theme": "Spiritual"
        }
      ]
    }`;

    const res = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are an Indian travel writer. You reason about pre-existing landmarks and output valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (res.data?.choices?.[0]?.message?.content) {
      const parsed = JSON.parse(res.data.choices[0].message.content);
      if (parsed.reasonings && Array.isArray(parsed.reasonings)) {
        return parsed.reasonings;
      }
    }
  } catch (err) {
    console.warn("Grok Intelligence call failed:", err.message);
  }
  return null;
}
