/**
 * MongoDB Connection Test Script
 * Run this to diagnose connection issues
 */

const dns = require('dns');
const dnsPromises = require('dns').promises;
require('dotenv').config();

// Set DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
dnsPromises.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

console.log('🔍 MongoDB Connection Diagnostic Tool\n');
console.log('=' .repeat(50));

async function testConnection() {
    // Step 1: Check environment variables
    console.log('\n1️⃣ Checking environment variables...');
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        console.error('❌ MONGODB_URI not found in .env file');
        return;
    }
    console.log('✅ MONGODB_URI found');
    console.log('   URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    // Step 2: Check DNS servers
    console.log('\n2️⃣ Checking DNS configuration...');
    const servers = dns.getServers();
    console.log('✅ DNS Servers:', servers.join(', '));

    // Step 3: Test DNS resolution
    console.log('\n3️⃣ Testing DNS resolution...');
    const hostname = '_mongodb._tcp.abdullah.uip35p4.mongodb.net';
    try {
        const resolved = await dnsPromises.resolveSrv(hostname);
        console.log('✅ DNS resolution successful!');
        console.log('   Found', resolved.length, 'MongoDB servers:');
        resolved.forEach((srv, i) => {
            console.log(`   ${i + 1}. ${srv.name}:${srv.port} (priority: ${srv.priority})`);
        });
    } catch (error) {
        console.error('❌ DNS resolution failed:', error.message);
        console.log('\n💡 This is likely the problem. Possible causes:');
        console.log('   - Your ISP is blocking DNS queries');
        console.log('   - Firewall is blocking DNS');
        console.log('   - Network connectivity issues');
        return;
    }

    // Step 4: Test MongoDB connection
    console.log('\n4️⃣ Testing MongoDB connection...');
    try {
        const mongoose = require('mongoose');
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            family: 4,
        });

        console.log('✅ MongoDB connection successful!');
        console.log('   Database:', mongoose.connection.name);
        console.log('   Host:', mongoose.connection.host);
        
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('\n💡 Possible causes:');
        console.log('   - IP address not whitelisted in MongoDB Atlas');
        console.log('   - Incorrect credentials');
        console.log('   - Network/firewall blocking MongoDB ports (27017)');
        console.log('   - ISP blocking MongoDB Atlas');
        return;
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed! Connection is working.');
}

// Run the test
testConnection().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});
