const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  destination: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  analytics: {
    type: Object
  },
  totalDays: {
    type: Number,
    required: true
  },
  days: {
    type: Array, // Daywise structure: [{ day: 1, places: [...] }, ...]
    required: true
  },
  hotels: {
    type: Array,
    default: []
  },
  restaurants: {
    type: Array,
    default: []
  },
  attractions: {
    type: Array,
    default: []
  },
  routes: {
    type: Array,
    default: []
  },
  weather: {
    type: Object,
    default: null
  },
  previewImage: {
    type: String
  }
}, {
  timestamps: true
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
module.exports = Itinerary;
