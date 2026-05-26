export const premiumRouteStops = {
  "chandigarh-jaipur": {
    routeId: "chandigarh-jaipur",
    source: "Chandigarh",
    destination: "Jaipur",
    famousStops: [
      {
        id: "chd_jai_1",
        name: "Brahma Sarovar",
        city: "Kurukshetra",
        state: "Haryana",
        lat: 29.9658,
        lng: 76.8340,
        category: "Historical & Spiritual",
        theme: "Spiritual",
        popularity: 92,
        whyVisit: "An ancient, sacred water tank connected to Mahabharata legends, offering a peaceful spiritual atmosphere.",
        imageQuery: "Brahma Sarovar Kurukshetra India",
        exactAddress: "Brahma Sarovar, Kurukshetra, Haryana, India"
      },
      {
        id: "chd_jai_2",
        name: "Jaipur City Palace",
        city: "Jaipur",
        state: "Rajasthan",
        lat: 26.9258,
        lng: 75.8236,
        category: "Iconic Attraction",
        theme: "Cultural",
        popularity: 96,
        whyVisit: "A stunning royal residence showcasing a blend of Rajasthani and Mughal architecture in the pink city.",
        imageQuery: "City Palace Jaipur India",
        exactAddress: "Tulsi Marg, Gangori Bazaar, Jaipur, Rajasthan, India"
      },
      {
        id: "chd_jai_3",
        name: "Neemrana Fort Palace",
        city: "Neemrana",
        state: "Rajasthan",
        lat: 27.9943,
        lng: 76.3888,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 93,
        whyVisit: "A breathtaking 15th-century fort palace cut into the Aravalli hills, representing royal heritage.",
        imageQuery: "Neemrana Fort Palace India",
        exactAddress: "15th Century Neemrana Fort, Alwar, Rajasthan, India"
      },
      {
        id: "chd_jai_4",
        name: "Amer Fort",
        city: "Jaipur",
        state: "Rajasthan",
        lat: 26.9855,
        lng: 75.8513,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 98,
        whyVisit: "A majestic hilltop fortress featuring grand red sandstone courtyards and the sparkling Sheesh Mahal.",
        imageQuery: "Amer Fort Jaipur India",
        exactAddress: "Devisinghpura, Amer, Jaipur, Rajasthan, India"
      },
      {
        id: "chd_jai_5",
        name: "Bhangarh Fort Ruins",
        city: "Bhangarh",
        state: "Rajasthan",
        lat: 27.0964,
        lng: 76.2858,
        category: "Historical Landmark",
        theme: "Adventure",
        popularity: 91,
        whyVisit: "The legendary and highly mysterious ruins of Bhangarh Fort, widely regarded as India's most haunted offbeat site.",
        imageQuery: "Bhangarh Fort Ruins Rajasthan",
        exactAddress: "Bhangarh, Alwar, Rajasthan, India"
      },
      {
        id: "chd_jai_6",
        name: "Sultanpur National Park",
        city: "Gurgaon",
        state: "Haryana",
        lat: 28.4622,
        lng: 76.8922,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 88,
        whyVisit: "A lush national wetland bird sanctuary sanctuary serving as a scenic home for hundreds of migratory species.",
        imageQuery: "Sultanpur Bird Sanctuary India",
        exactAddress: "Gurgaon-Farukh Nagar Road, Gurgaon, Haryana, India"
      }
    ],
    nearbyDestinations: [
      {
        name: "Kasauli Hills",
        city: "Kasauli",
        distance: "58 km away",
        travelTime: "1.5 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 92,
        reason: "Tranquil pine forested hill cantonment ideal for nature walks.",
        imageSrc: ""
      },
      {
        name: "Chail Sanctuary",
        city: "Chail",
        distance: "106 km away",
        travelTime: "2.5 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 89,
        reason: "Densely forested hill station with the world's highest cricket ground.",
        imageSrc: ""
      }
    ],
    alternateThemes: {
      Cultural: { places: ["chd_jai_1", "chd_jai_2"], distance: 340, routeColor: "Green" },
      Heritage: { places: ["chd_jai_3", "chd_jai_4"], distance: 365, routeColor: "Purple" },
      Pioneer: { places: ["chd_jai_5", "chd_jai_6"], distance: 390, routeColor: "Orange" }
    }
  },
  "ahmedabad-agra": {
    routeId: "ahmedabad-agra",
    source: "Ahmedabad",
    destination: "Agra",
    famousStops: [
      {
        id: "ahm_agr_1",
        name: "Ajmer Sharif Dargah",
        city: "Ajmer",
        state: "Rajasthan",
        lat: 26.4561,
        lng: 74.6281,
        category: "Pilgrimage Site",
        theme: "Spiritual",
        popularity: 95,
        whyVisit: "The holy shrine of Sufi saint Khwaja Moinuddin Chishti, drawing millions seeking spiritual harmony.",
        imageQuery: "Ajmer Sharif Dargah India",
        exactAddress: "Dargah Bazar, Ajmer, Rajasthan, India"
      },
      {
        id: "ahm_agr_2",
        name: "Brahma Temple",
        city: "Pushkar",
        state: "Rajasthan",
        lat: 26.4897,
        lng: 74.5510,
        category: "Pilgrimage Site",
        theme: "Cultural",
        popularity: 93,
        whyVisit: "One of the extremely rare temples in the world dedicated to Lord Brahma, situated near the sacred Pushkar lake.",
        imageQuery: "Pushkar Temple India",
        exactAddress: "Brahma Temple Road, Pushkar, Rajasthan, India"
      },
      {
        id: "ahm_agr_3",
        name: "Chittorgarh Fort",
        city: "Chittorgarh",
        state: "Rajasthan",
        lat: 24.8879,
        lng: 74.6451,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 97,
        whyVisit: "The grandest fort in India, standing as a colossal symbol of Rajput courage, sacrifice, and architecture.",
        imageQuery: "Chittorgarh Fort India",
        exactAddress: "Chittorgarh Fort, Rajasthan, India"
      },
      {
        id: "ahm_agr_4",
        name: "Fatehpur Sikri",
        city: "Fatehpur Sikri",
        state: "Uttar Pradesh",
        lat: 27.0945,
        lng: 77.6679,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 96,
        whyVisit: "The imperial red sandstone capital founded by Emperor Akbar, home to Buland Darwaza and Panch Mahal.",
        imageQuery: "Fatehpur Sikri Agra India",
        exactAddress: "Fatehpur Sikri, Agra, Uttar Pradesh, India"
      },
      {
        id: "ahm_agr_5",
        name: "Lake Pichola Palace",
        city: "Udaipur",
        state: "Rajasthan",
        lat: 24.5764,
        lng: 73.6835,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 97,
        whyVisit: "The romantic, floating heritage palaces of Udaipur reflecting beautifully off the tranquil waters of Pichola.",
        imageQuery: "Lake Pichola Udaipur India",
        exactAddress: "Lake Pichola, Udaipur, Rajasthan, India"
      },
      {
        id: "ahm_agr_6",
        name: "Taj Mahal",
        city: "Agra",
        state: "Uttar Pradesh",
        lat: 27.1751,
        lng: 78.0421,
        category: "Historical Landmark",
        theme: "Scenic",
        popularity: 100,
        whyVisit: "The ultimate monument of eternal love, built of pristine white marble and universally admired as a World Wonder.",
        imageQuery: "Taj Mahal Agra India",
        exactAddress: "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh, India"
      }
    ],
    nearbyDestinations: [
      {
        name: "Mathura Temples",
        city: "Mathura",
        distance: "58 km away",
        travelTime: "1.2 hours",
        category: "Pilgrimage Site",
        theme: "Spiritual",
        popularityScore: 96,
        reason: "The sacred birthplace of Lord Krishna along the Yamuna river.",
        imageSrc: ""
      },
      {
        name: "Bharatpur Bird Sanctuary",
        city: "Bharatpur",
        distance: "55 km away",
        travelTime: "1.1 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 92,
        reason: "Renowned UNESCO national park and avian bird-watching paradise.",
        imageSrc: ""
      }
    ],
    alternateThemes: {
      Cultural: { places: ["ahm_agr_1", "ahm_agr_2"], distance: 880, routeColor: "Green" },
      Heritage: { places: ["ahm_agr_3", "ahm_agr_4"], distance: 910, routeColor: "Purple" },
      Pioneer: { places: ["ahm_agr_5", "ahm_agr_6"], distance: 935, routeColor: "Orange" }
    }
  },
  "jodhpur-mumbai": {
    routeId: "jodhpur-mumbai",
    source: "Jodhpur",
    destination: "Mumbai",
    famousStops: [
      {
        id: "jod_mum_1",
        name: "Dilwara Marble Temples",
        city: "Mount Abu",
        state: "Rajasthan",
        lat: 24.5959,
        lng: 72.7118,
        category: "Pilgrimage Site",
        theme: "Spiritual",
        popularity: 94,
        whyVisit: "World-famous Jain temples carved out of pure white marble, displaying unmatched architectural detail.",
        imageQuery: "Dilwara Temple Mount Abu",
        exactAddress: "Dilwara, Mount Abu, Rajasthan, India"
      },
      {
        id: "jod_mum_2",
        name: "Gateway of India",
        city: "Mumbai",
        state: "Maharashtra",
        lat: 18.9220,
        lng: 72.8347,
        category: "Historical Landmark",
        theme: "Cultural",
        popularity: 99,
        whyVisit: "An iconic landmark stone arch built in 1911 to commemorate the royal visit of King George V.",
        imageQuery: "Gateway of India Mumbai",
        exactAddress: "Apollo Bandar, Colaba, Mumbai, Maharashtra, India"
      },
      {
        id: "jod_mum_3",
        name: "Laxmi Vilas Palace",
        city: "Vadodara",
        state: "Gujarat",
        lat: 22.2936,
        lng: 73.1906,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 95,
        whyVisit: "An imposing, majestic royal palace four times the size of Buckingham Palace, boasting beautiful Indo-Saracenic styles.",
        imageQuery: "Laxmi Vilas Palace Vadodara",
        exactAddress: "Jawaharlal Nehru Marg, Vadodara, Gujarat, India"
      },
      {
        id: "jod_mum_4",
        name: "City Palace Udaipur",
        city: "Udaipur",
        state: "Rajasthan",
        lat: 24.5764,
        lng: 73.6835,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 97,
        whyVisit: "A stunning hilltop royal palace overlooking Lake Pichola, showcasing rich Mewar history and courtyards.",
        imageQuery: "City Palace Udaipur India",
        exactAddress: "City Palace, Udaipur, Rajasthan, India"
      },
      {
        id: "jod_mum_5",
        name: "Nakki Sacred Lake",
        city: "Mount Abu",
        state: "Rajasthan",
        lat: 24.5935,
        lng: 72.7050,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 90,
        whyVisit: "A pristine high-altitude lake surrounded by green hill stations, believed to have been carved by the gods' nails.",
        imageQuery: "Nakki Lake Mount Abu India",
        exactAddress: "Nakki Lake, Mount Abu, Rajasthan, India"
      },
      {
        id: "jod_mum_6",
        name: "Marine Drive Boulevard",
        city: "Mumbai",
        state: "Maharashtra",
        lat: 18.9440,
        lng: 72.8227,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 98,
        whyVisit: "The famous C-shaped coastal boulevard along the Arabian Sea, locally known as the Queen's Necklace.",
        imageQuery: "Marine Drive Mumbai",
        exactAddress: "Netaji Subhash Chandra Bose Road, Mumbai, Maharashtra, India"
      }
    ],
    nearbyDestinations: [
      {
        name: "Lonavala Hills",
        city: "Lonavala",
        distance: "83 km away",
        travelTime: "1.8 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 94,
        reason: "Verdant green hill station famous for mist-covered waterfalls and chikki.",
        imageSrc: ""
      },
      {
        name: "Alibaug Beaches",
        city: "Alibaug",
        distance: "95 km away",
        travelTime: "2.2 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 89,
        reason: "Beautiful coastal getaway featuring sandy black beaches and sea forts.",
        imageSrc: ""
      }
    ],
    alternateThemes: {
      Cultural: { places: ["jod_mum_1", "jod_mum_2"], distance: 980, routeColor: "Green" },
      Heritage: { places: ["jod_mum_3", "jod_mum_4"], distance: 1010, routeColor: "Purple" },
      Pioneer: { places: ["jod_mum_5", "jod_mum_6"], distance: 1040, routeColor: "Orange" }
    }
  },
  "lucknow-goa": {
    routeId: "lucknow-goa",
    source: "Lucknow",
    destination: "Goa",
    famousStops: [
      {
        id: "luc_goa_1",
        name: "Khajuraho Western Temples",
        city: "Khajuraho",
        state: "Madhya Pradesh",
        lat: 24.8517,
        lng: 79.9216,
        category: "Pilgrimage Site",
        theme: "Spiritual",
        popularity: 96,
        whyVisit: "UNESCO World Heritage temples world-famous for their intricate sandstone architectural carvings.",
        imageQuery: "Khajuraho Temple India",
        exactAddress: "Rajnagar Road, Khajuraho, Madhya Pradesh, India"
      },
      {
        id: "luc_goa_2",
        name: "Hyderabad Charminar",
        city: "Hyderabad",
        state: "Telangana",
        lat: 17.3616,
        lng: 78.4747,
        category: "Historical Landmark",
        theme: "Cultural",
        popularity: 98,
        whyVisit: "The globally iconic mosque monument featuring four grand minarets, built in the heart of old Hyderabad.",
        imageQuery: "Charminar Hyderabad India",
        exactAddress: "Charminar Road, Hyderabad, Telangana, India"
      },
      {
        id: "luc_goa_3",
        name: "Hampi Ancient Capital Ruins",
        city: "Hampi",
        state: "Karnataka",
        lat: 15.3350,
        lng: 76.4600,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 97,
        whyVisit: "The spectacular ruins of the historic Vijayanagara Empire, showcasing giant stone chariots and carved pillars.",
        imageQuery: "Hampi Ruins Karnataka India",
        exactAddress: "Hampi, Vijayanagara, Karnataka, India"
      },
      {
        id: "luc_goa_4",
        name: "Golconda Fort Complex",
        city: "Hyderabad",
        state: "Telangana",
        lat: 17.3833,
        lng: 78.4011,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 95,
        whyVisit: "A historic citadel fortress legendary for its acoustics, royal diamond vault history, and massive stone walls.",
        imageQuery: "Golconda Fort Hyderabad",
        exactAddress: "Ibrahim Bagh, Hyderabad, Telangana, India"
      },
      {
        id: "luc_goa_5",
        name: "Pench Tiger Sanctuary",
        city: "Pench",
        state: "Madhya Pradesh",
        lat: 21.6888,
        lng: 79.2241,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 89,
        whyVisit: "The dense teak forests that inspired Rudyard Kipling's 'The Jungle Book', rich in national park wildlife.",
        imageQuery: "Pench National Park Sanctuary",
        exactAddress: "Seoni, Madhya Pradesh, India"
      },
      {
        id: "luc_goa_6",
        name: "Gokarna Om Beaches",
        city: "Gokarna",
        state: "Karnataka",
        lat: 14.5204,
        lng: 74.3188,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 93,
        whyVisit: "A peaceful coastal town featuring pristine, golden sandy beaches shaped like the spiritual Om symbol.",
        imageQuery: "Gokarna Beach Om India",
        exactAddress: "Om Beach, Gokarna, Karnataka, India"
      }
    ],
    nearbyDestinations: [
      {
        name: "Dudhsagar Waterfalls",
        city: "Collem",
        distance: "60 km away",
        travelTime: "1.5 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 95,
        reason: "A majestic four-tiered milk-white waterfall cascade along the railway route.",
        imageSrc: ""
      },
      {
        name: "Panaji Latin Quarter",
        city: "Panaji",
        distance: "15 km away",
        travelTime: "0.4 hours",
        category: "Historical Landmark",
        theme: "Heritage",
        popularityScore: 92,
        reason: "The colorful Portuguese heritage district of Fontainhas.",
        imageSrc: ""
      }
    ],
    alternateThemes: {
      Cultural: { places: ["luc_goa_1", "luc_goa_2"], distance: 1650, routeColor: "Green" },
      Heritage: { places: ["luc_goa_3", "luc_goa_4"], distance: 1720, routeColor: "Purple" },
      Pioneer: { places: ["luc_goa_5", "luc_goa_6"], distance: 1780, routeColor: "Orange" }
    }
  },
  "chandigarh-manali": {
    routeId: "chandigarh-manali",
    source: "Chandigarh",
    destination: "Manali",
    famousStops: [
      {
        id: "chd_man_1",
        name: "Takht Sri Keshgarh Gurudwara",
        city: "Anandpur Sahib",
        state: "Punjab",
        lat: 31.2335,
        lng: 76.4965,
        category: "Pilgrimage Site",
        theme: "Spiritual",
        popularity: 95,
        whyVisit: "The holy temporal seat of Sikhism where the Khalsa panth was founded by Guru Gobind Singh Ji.",
        imageQuery: "Anandpur Sahib Gurudwara",
        exactAddress: "Anandpur Sahib, Rupnagar, Punjab, India"
      },
      {
        id: "chd_man_2",
        name: "Kullu Shawl Weaver Hubs",
        city: "Kullu",
        state: "Himachal Pradesh",
        lat: 31.9578,
        lng: 77.1095,
        category: "Cultural Heritage",
        theme: "Cultural",
        popularity: 91,
        whyVisit: "The vibrant local heritage craft markets of Kullu, world-renowned for weaving premium handloom shawls.",
        imageQuery: "Kullu Himachal Crafts",
        exactAddress: "Kullu Valley, Himachal Pradesh, India"
      },
      {
        id: "chd_man_3",
        name: "Shimla Mall Road & Ridge",
        city: "Shimla",
        state: "Himachal Pradesh",
        lat: 31.1048,
        lng: 77.1734,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 97,
        whyVisit: "The famous British colonial capital ridge, featuring historic pedestrian streets and mountain valley views.",
        imageQuery: "Shimla Mall Road Ridge",
        exactAddress: "The Mall Road, Shimla, Himachal Pradesh, India"
      },
      {
        id: "chd_man_4",
        name: "Naggar Castle Heritage",
        city: "Naggar",
        state: "Himachal Pradesh",
        lat: 32.1120,
        lng: 77.1764,
        category: "Historical Landmark",
        theme: "Heritage",
        popularity: 92,
        whyVisit: "A historic 15th-century wooden castle overlooking the Beas river, showcasing authentic Himalayan craft styles.",
        imageQuery: "Naggar Castle Himachal India",
        exactAddress: "Naggar, Kullu District, Himachal Pradesh, India"
      },
      {
        id: "chd_man_5",
        name: "Kasauli Pine Hills",
        city: "Kasauli",
        state: "Himachal Pradesh",
        lat: 30.8996,
        lng: 76.9609,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 90,
        whyVisit: "A peaceful weekend hill station offering mist-covered nature hikes and colonial church view paths.",
        imageQuery: "Kasauli Pines Hills",
        exactAddress: "Kasauli Cantonment, Solan, Himachal Pradesh, India"
      },
      {
        id: "chd_man_6",
        name: "Solang Valley Adventure",
        city: "Manali",
        state: "Himachal Pradesh",
        lat: 32.3165,
        lng: 77.1650,
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularity: 96,
        whyVisit: "A breathtaking side valley famous for snow fields, adventure sports like paragliding, and high mountains.",
        imageQuery: "Solang Valley Manali India",
        exactAddress: "Solang Valley, Manali, Himachal Pradesh, India"
      }
    ],
    nearbyDestinations: [
      {
        name: "Rohtang Mountain Pass",
        city: "Manali",
        distance: "51 km away",
        travelTime: "1.8 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 98,
        reason: "A high altitude mountain pass offering stunning glaciers and snow peaks.",
        imageSrc: ""
      },
      {
        name: "Atal Tunnel Landmark",
        city: "Manali",
        distance: "28 km away",
        travelTime: "0.8 hours",
        category: "Scenic Hotspot",
        theme: "Scenic",
        popularityScore: 96,
        reason: "The world's longest single-tube highway tunnel above 10,000 feet.",
        imageSrc: ""
      }
    ],
    alternateThemes: {
      Cultural: { places: ["chd_man_1", "chd_man_2"], distance: 290, routeColor: "Green" },
      Heritage: { places: ["chd_man_3", "chd_man_4"], distance: 310, routeColor: "Purple" },
      Pioneer: { places: ["chd_man_5", "chd_man_6"], distance: 330, routeColor: "Orange" }
    }
  }
};
