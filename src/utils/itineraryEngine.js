/**
 * Core Logic for generating varied itinerary plans via Regional Geographic Super-Clustering.
 */

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Route Optimization: Nearest Neighbor TSP
export const optimizeRoute = (items) => {
  if (items.length <= 1) return items;
  const optimized = [items[0]];
  const unvisited = items.slice(1);

  let current = items[0];
  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistance(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
        if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = i;
        }
    }

    current = unvisited[nearestIdx];
    optimized.push(current);
    unvisited.splice(nearestIdx, 1);
  }
  
  return optimized;
};

// Guarantees exact item counts evenly mapped across exactly N days
const chunkPoolGeographicallyDays = (pool, days, targetSpotsPerDay) => {
    if (!pool || pool.length === 0) return Array.from({length: days}, () => []);
    
    // We already have exactly the target items from the draft
    const dayClusters = [];
    let remaining = [...pool];
    
    const baseCount = Math.floor(remaining.length / days);
    let remainder = remaining.length % days;
    
    for (let d = 0; d < days; d++) {
        if (remaining.length === 0) {
           dayClusters.push([]);
           continue;
        }
        
        const spotsThisDay = baseCount + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;

        const seed = remaining.splice(0, 1)[0];
        const cluster = [seed];
        
        const needed = Math.min(spotsThisDay - 1, remaining.length);
        
        if (needed > 0) {
            remaining.sort((a, b) => calculateDistance(seed.lat, seed.lon, a.lat, a.lon) - calculateDistance(seed.lat, seed.lon, b.lat, b.lon));
            const closest = remaining.splice(0, needed);
            cluster.push(...closest);
        }
        dayClusters.push(cluster);
    }
    return dayClusters;
};

// Executes the Super-Cluster Regional Draft
const draftRegionalPools = (attractions, days, minPlacesPerDay = 3) => {
    const totalRequiredPerPlan = days * minPlacesPerDay;
    let available = [...attractions]; // Assume pre-sorted by rank
    
    if (available.length < 3) return { poolA: available, poolB: [], poolC: [] }; // Failsafe
    
    // Balance: Cap religious places to max 1 per day (on average) to avoid dominance. Cap malls to 2 total.
    const maxReligionPlaces = days;
    const maxMalls = 2;
    let religionCount = 0;
    let mallCount = 0;
    const getPriority = (categories) => {
        if (!categories) return 3;
        if (categories.includes('heritage') || categories.includes('historic') || categories.includes('architecture')) return 1;
        if (categories.includes('religion')) return 2;
        if (categories.includes('malls') || categories.includes('shops') || categories.includes('market') || categories.includes('commercial')) return 4;
        return 3;
    };

    let filteredAvailable = available.filter(a => {
        const isReligion = a.categories && a.categories.includes('religion');
        const isMall = a.categories && (a.categories.includes('malls') || a.categories.includes('shops') || a.categories.includes('market') || a.categories.includes('commercial'));
        
        if (isReligion) {
            religionCount++;
            return religionCount <= maxReligionPlaces;
        }
        if (isMall) {
            mallCount++;
            return mallCount <= maxMalls;
        }
        return true;
    });

    if (filteredAvailable.length < totalRequiredPerPlan) {
        // Failsafe: if filtering drops us below required amount, relax filters to ensure minimum places
        filteredAvailable = [...available]; 
    }
    
    available = filteredAvailable;
    
    // Sort by Priority (Landmarks -> Religion -> Attractions -> Malls), then by Rank
    available.sort((a, b) => {
        const pA = getPriority(a.categories);
        const pB = getPriority(b.categories);
        if (pA !== pB) return pA - pB;
        return (b.rank || 0) - (a.rank || 0);
    });

    if (available.length < 3) return { poolA: available, poolB: [], poolC: [] }; // Fallback

    // 1. Pick 3 distinct regional seeds
    const seedA = available.shift();
    let seedB = available.find(a => calculateDistance(seedA.lat, seedA.lon, a.lat, a.lon) > 4);
    if (!seedB) seedB = available.shift(); // If city is tiny, ignore distance rules
    else available.splice(available.indexOf(seedB), 1);
    
    let seedC = available.find(a => calculateDistance(seedA.lat, seedA.lon, a.lat, a.lon) > 4 && calculateDistance(seedB.lat, seedB.lon, a.lat, a.lon) > 4);
    if (!seedC) seedC = available.shift();
    else available.splice(available.indexOf(seedC), 1);
    
    const poolA = [seedA];
    const poolB = [seedB];
    const poolC = [seedC];
    
    // 2. Draft Phase (Round Robin Snapping)
    const draftTarget = totalRequiredPerPlan - 1; // 1 already taken by seed
    
    for (let i = 0; i < draftTarget; i++) {
        if (available.length === 0) break;
        
        // Draft for A
        if (available.length > 0) {
            available.sort((a, b) => calculateDistance(seedA.lat, seedA.lon, a.lat, a.lon) - calculateDistance(seedA.lat, seedA.lon, b.lat, b.lon));
            poolA.push(available.shift());
        }
        // Draft for B
        if (available.length > 0) {
            available.sort((a, b) => calculateDistance(seedB.lat, seedB.lon, a.lat, a.lon) - calculateDistance(seedB.lat, seedB.lon, b.lat, b.lon));
            poolB.push(available.shift());
        }
        // Draft for C
        if (available.length > 0) {
            available.sort((a, b) => calculateDistance(seedC.lat, seedC.lon, a.lat, a.lon) - calculateDistance(seedC.lat, seedC.lon, b.lat, b.lon));
            poolC.push(available.shift());
        }
    }
    
    return { poolA, poolB, poolC };
};

export const generatePlans = (attractions, hotels, days, cityRank) => {
  if (!attractions || attractions.length === 0) return [];

  const checkCategory = (categories, match) => {
    if (!categories) return false;
    return categories.some(cat => cat.includes(match));
  };

  const getIconForCategory = (categories) => {
    if (checkCategory(categories, 'religion')) return 'Temple';
    if (checkCategory(categories, 'heritage')) return 'History';
    if (checkCategory(categories, 'park') || checkCategory(categories, 'garden')) return 'Trees';
    if (checkCategory(categories, 'museum')) return 'Library';
    if (checkCategory(categories, 'market') || checkCategory(categories, 'malls') || checkCategory(categories, 'shops') || checkCategory(categories, 'commercial')) return 'ShoppingBag';
    return 'MapPin';
  };

  // Perform Draft
  const placesPerDay = 4; // Target 4 balanced top locations per day per plan
  const { poolA, poolB, poolC } = draftRegionalPools(attractions, days, placesPerDay);

  const createDayWisePlan = (pool, spotsPerDay) => {
    const geoChunks = chunkPoolGeographicallyDays(pool, days, spotsPerDay);
    const dayWise = [];
    
    for (let i = 0; i < days; i++) {
        const rawActivities = geoChunks[i] || [];
        const dayActivities = optimizeRoute(rawActivities);

        const mappedActivities = dayActivities.map((item, idx) => {
            let distFromPrev = 0;
            if (idx > 0) {
               distFromPrev = calculateDistance(
                   dayActivities[idx-1].lat, dayActivities[idx-1].lon,
                   item.lat, item.lon
               );
            }
            return {
                id: item.id,
                xid: item.xid, // Propagate the openTripMap xid
                name: item.name,
                lat: item.lat,
                lon: item.lon,
                type: item.type || 'Attraction',
                time: '1.5 - 2 hours',
                icon: getIconForCategory(item.categories),
                distanceFromPrevKm: distFromPrev.toFixed(1)
            };
        });

        let transportMode = 'City Cabs / Auto';
        let totalKm = mappedActivities.reduce((acc, curr) => acc + parseFloat(curr.distanceFromPrevKm), 0);
        if (totalKm < 3) transportMode = 'Walking / Local E-Rickshaw';
        else if (totalKm > 20) transportMode = 'Private AC Rental';

        dayWise.push({
            day: i + 1,
            activities: mappedActivities,
            transport: transportMode
        });
    }
    return dayWise;
  };

  const evaluateAnalytics = (dayWise, poolSize) => {
      let totalDistance = 0;
      const categories = {};

      dayWise.forEach(day => {
          day.activities.forEach(act => {
              totalDistance += parseFloat(act.distanceFromPrevKm || 0);

              // Calculate Category Breakdown
              const type = act.type || 'General';
              categories[type] = (categories[type] || 0) + 1;
          });
      });
      
      const totalKm = Math.round(totalDistance * 10) / 10;
      const travelHours = (totalKm / 18).toFixed(1); // Assuming 18 km/h city average
      
      // Convert category object to array suitable for Charts
      const categoryBreakdown = Object.entries(categories).map(([name, value]) => ({
          name, value
      }));

      return {
          totalDistance: totalKm,
          totalPlaces: poolSize,
          avgPlacesPerDay: (poolSize / days).toFixed(1),
          travelHours: travelHours,
          categoryBreakdown: categoryBreakdown
      };
  };

  const daysA = createDayWisePlan(poolA, placesPerDay);
  const analyticsA = evaluateAnalytics(daysA, poolA.length);

  const daysB = createDayWisePlan(poolB, placesPerDay);
  const analyticsB = evaluateAnalytics(daysB, poolB.length);

  const daysC = createDayWisePlan(poolC, placesPerDay);
  const analyticsC = evaluateAnalytics(daysC, poolC.length);

  return [
    {
      id: 'routeA',
      name: 'Cultural Explorer',
      description: 'A deep-dive regional route focusing on heavily localized cultural hubs without cross-city travel.',
      analytics: analyticsA,
      days: daysA
    },
    {
      id: 'routeB',
      name: 'Heritage Path',
      description: 'An entirely distinct geographic sector focusing on a different face of the city.',
      analytics: analyticsB,
      days: daysB
    },
    {
      id: 'routeC',
      name: 'Pioneer Trail',
      description: 'A complete alternative featuring exclusive remote landmarks tailored into efficient daily clusters.',
      analytics: analyticsC,
      days: daysC
    }
  ];
};
