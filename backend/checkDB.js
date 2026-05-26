const mongoose = require('mongoose');
const Itinerary = require('./models/Itinerary');

mongoose.connect('mongodb://127.0.0.1:27017/itenary_db').then(async () => {
    const itins = await Itinerary.find();
    console.log(JSON.stringify(itins, null, 2));
    process.exit(0);
});
