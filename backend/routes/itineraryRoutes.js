const express = require('express');
const router = express.Router();
const { saveItinerary, getUserItineraries, getItineraryById, deleteItinerary } = require('../controllers/itineraryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/save').post(protect, saveItinerary);
router.route('/user').get(protect, getUserItineraries);
router.route('/:id').get(protect, getItineraryById).delete(protect, deleteItinerary);

module.exports = router;
