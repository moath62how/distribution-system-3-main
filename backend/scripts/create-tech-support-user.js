#!/usr/bin/env node

/**
 * Script to create a default tech support user
 * Usage: node backend/scripts/create-tech-support-user.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/distribution-system';

async function createTechSupportUser() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if tech support user already exists
        const existingUser = await User.findOne({ role: 'tech_support' });

        if (existingUser) {
            console.log('ℹ️  Tech support user already exists:');
            console.log(`   Username: ${existingUser.username}`);
            console.log(`   Phone: ${existingUser.phone || 'Not set'}`);
            console.log(`   Role: ${existingUser.role}`);
            console.log(`   Active: ${existingUser.active}`);

            // Ask if user wants to update
            console.log('\n⚠️  User already exists. Skipping creation.');
            return;
        }

        // Create new tech support user
        const techSupportUser = await User.create({
            username: 'الدعم_الفني',
            phone: '+201234567890',
            password: 'techsupport123', // Will be hashed by pre-save hook
            role: 'tech_support',
            active: true
        });

        console.log('\n✅ Tech support user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 Login Credentials:');
        console.log(`   Phone: ${techSupportUser.phone}`);
        console.log(`   You can login with: 01234567890 or 1234567890 or +201234567890`);
        console.log(`   Password: techsupport123`);
        console.log(`   Role: ${techSupportUser.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
        console.log('💡 Note: All phone formats are accepted (01xxx, 1xxx, +201xxx)');
        console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    } catch (error) {
        console.error('❌ Error creating tech support user:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the script
createTechSupportUser()
    .then(() => {
        console.log('\n✨ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
