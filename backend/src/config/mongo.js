const mongoose = require('mongoose');

async function connectMongo() {
  try {
    await mongoose.connect('mongodb://mongo:27017/reportit_db');

    console.log('MongoDB connected');
  } catch (error) {
    console.error('Mongo connection error:', error);

    process.exit(1);
  }
}

module.exports = connectMongo;