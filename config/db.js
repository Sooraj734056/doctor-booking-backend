const mongoose = require('mongoose');

const connectDB = async () => {
  const connect = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('🔄 Retrying MongoDB connection in 5 seconds...');
      setTimeout(connect, 5000);
    }
  };
  await connect();
};

module.exports = connectDB;
