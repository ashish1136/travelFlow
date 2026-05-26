const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Itinerary = require('./models/Itinerary');

// Load env vars
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/itenary_db';

console.log('Connecting to database...');
console.log('MONGO_URI:', MONGO_URI.replace(/:([^@]+)@/, ':****@')); // Hide credentials

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB.');

    const itineraries = await Itinerary.find({});
    console.log(`Found ${itineraries.length} total itineraries in database.`);

    let updatedCount = 0;

    const correctImages = {
      chandigarh: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80', // Serene Sukhna Lake boat representative
      varanasi: 'https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=800&q=80', // Ganga Ghat Varanasi
      delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', // Red Fort
      jaipur: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=800&q=80', // Hawa Mahal Jaipur
      mumbai: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80', // Gateway of India / Taj Palace Hotel Mumbai
      pune: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=800&q=80', // Shaniwar Wada
      amritsar: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80', // Golden Temple
      patna: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', // Ganges River boat ride representative
      bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', // Bangalore Palace
      kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80', // Victoria Memorial Kolkata
      goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', // Goa Sunset Beach
      shimla: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=800&q=80', // Shimla Ridge
      manali: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80', // Solang Valley Manali
      neutral: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80', // Neutral fallback
    };

    for (const itinerary of itineraries) {
      const destLower = (itinerary.destination || '').toLowerCase().trim();
      const prevImage = itinerary.previewImage || '';

      let needsUpdate = false;
      let newImage = prevImage;

      if (destLower.includes('chandigarh')) {
        needsUpdate = true;
        newImage = correctImages.chandigarh;
      } else if (destLower.includes('varanasi')) {
        needsUpdate = true;
        newImage = correctImages.varanasi;
      } else if (destLower.includes('delhi') || destLower.includes('del')) {
        needsUpdate = true;
        newImage = correctImages.delhi;
      } else if (destLower.includes('jaipur')) {
        needsUpdate = true;
        newImage = correctImages.jaipur;
      } else if (destLower.includes('mumbai') || destLower.includes('bom')) {
        needsUpdate = true;
        newImage = correctImages.mumbai;
      } else if (destLower.includes('amritsar')) {
        needsUpdate = true;
        newImage = correctImages.amritsar;
      } else if (destLower.includes('pune')) {
        needsUpdate = true;
        newImage = correctImages.pune;
      } else if (destLower.includes('patna')) {
        needsUpdate = true;
        newImage = correctImages.patna;
      } else if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
        needsUpdate = true;
        newImage = correctImages.bangalore;
      } else if (destLower.includes('kolkata') || destLower.includes('calcutta')) {
        needsUpdate = true;
        newImage = correctImages.kolkata;
      } else if (destLower.includes('goa')) {
        needsUpdate = true;
        newImage = correctImages.goa;
      } else if (destLower.includes('shimla')) {
        needsUpdate = true;
        newImage = correctImages.shimla;
      } else if (destLower.includes('manali')) {
        needsUpdate = true;
        newImage = correctImages.manali;
      } else {
        needsUpdate = true;
        newImage = correctImages.neutral;
      }

      if (needsUpdate && prevImage !== newImage) {
        itinerary.previewImage = newImage;
        await itinerary.save();
        console.log(`Updated itinerary "${itinerary.title}" (ID: ${itinerary._id}) for ${itinerary.destination}.`);
        console.log(`  Old image: ${prevImage}`);
        console.log(`  New image: ${newImage}`);
        updatedCount++;
      }
    }

    console.log(`Success! Updated ${updatedCount} itineraries.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
