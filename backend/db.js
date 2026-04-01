const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Force Node to use Google DNS + Cloudflare DNS for SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

// Also set DNS for promises
const dnsPromises = require('dns').promises;
dnsPromises.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

/**
 * MongoDB connection using Mongoose
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/distribution_system';
    
    console.log('Connecting to MongoDB:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Test DNS resolution first
    console.log('Testing DNS resolution...');
    try {
      const resolved = await dnsPromises.resolveSrv('_mongodb._tcp.abdullah.uip35p4.mongodb.net');
      console.log('✅ DNS resolution successful:', resolved.length, 'servers found');
    } catch (dnsError) {
      console.warn('⚠️ DNS resolution warning:', dnsError.message);
      console.log('Attempting connection anyway...');
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 60000, // Increased to 60 seconds
      socketTimeoutMS: 60000,
      family: 4, // Force IPv4
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Check your internet connection');
    console.log('2. Verify IP whitelist in MongoDB Atlas');
    console.log('3. Try restarting your router/modem');
    console.log('4. Check if your ISP is blocking MongoDB ports');
    console.log('5. Try using a VPN or mobile hotspot');
    
    process.exit(1);
  }
};

/**
 * Initialize database connection and models
 */
async function ensureTables() {
  await connectDB();

  // Import all models to ensure they are registered
  require('./models');

  console.log('📦 All MongoDB models loaded successfully');
}

// Export the connection function for backward compatibility
module.exports = {
  ensureTables,
  connectDB,
  mongoose
};
