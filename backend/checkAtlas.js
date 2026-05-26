const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Itinerary = require('./models/Itinerary');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const itins = await Itinerary.find({}, { destination: 1, previewImage: 1, title: 1 });
    console.log(JSON.stringify(itins, null, 2));
    process.exit(0);
});
