/**
 * Migration Script: Add Default Category to Expenses
 * 
 * This script finds all expenses with missing category field
 * and sets them to the default 'أخرى' (Other).
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Expense = require('../models/Expense');

async function fixExpenseCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Find all expenses with missing category
        const expenses = await Expense.find({
            $or: [
                { category: { $exists: false } },
                { category: null },
                { category: '' }
            ]
        });

        console.log(`\n💰 Found ${expenses.length} expenses with missing categories\n`);

        if (expenses.length === 0) {
            console.log('✅ No expenses need fixing!');
            await mongoose.connection.close();
            return;
        }

        let fixed = 0;

        for (const expense of expenses) {
            try {
                // Set default category
                expense.category = 'أخرى';
                await expense.save();
                
                console.log(`✅ Fixed expense ${expense._id}:`);
                console.log(`   Description: ${expense.description}`);
                console.log(`   Amount: ${expense.amount}`);
                console.log(`   Category set to: أخرى`);
                console.log('');
                
                fixed++;
            } catch (error) {
                console.error(`❌ Error processing expense ${expense._id}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total expenses processed: ${expenses.length}`);
        console.log(`✅ Successfully fixed: ${fixed}`);
        console.log('='.repeat(60));

        console.log('\n💡 NOTE: All expenses have been set to category "أخرى" (Other).');
        console.log('You can edit them individually to set the correct category:');
        console.log('  - إدارية (Administrative)');
        console.log('  - رواتب (Salaries)');
        console.log('  - تشغيلية (Operational)');
        console.log('  - أخرى (Other)');

        await mongoose.connection.close();
        console.log('\n✅ Migration completed and database connection closed');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the migration
console.log('🚀 Starting migration: Fix Expense Categories');
console.log('='.repeat(60));
fixExpenseCategories();
