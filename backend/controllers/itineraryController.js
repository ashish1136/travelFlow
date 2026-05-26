const Itinerary = require('../models/Itinerary');

const saveItinerary = async (req, res) => {
  const { destination, title, name, description, analytics, totalDays, days, hotels, restaurants, attractions, routes, weather, previewImage } = req.body;

  try {
    const itinerary = new Itinerary({
      userId: req.user._id,
      destination,
      title,
      name,
      description,
      analytics,
      totalDays,
      days,
      hotels,
      restaurants,
      attractions,
      routes,
      weather,
      previewImage
    });

    const savedItinerary = await itinerary.save();
    res.status(201).json(savedItinerary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (itinerary) {
      if (itinerary.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to view this itinerary' });
      }
      res.json(itinerary);
    } else {
      res.status(404).json({ message: 'Itinerary not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (itinerary) {
      if (itinerary.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this itinerary' });
      }
      await Itinerary.deleteOne({ _id: req.params.id });
      res.json({ message: 'Itinerary removed' });
    } else {
      res.status(404).json({ message: 'Itinerary not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveItinerary,
  getUserItineraries,
  getItineraryById,
  deleteItinerary
};
