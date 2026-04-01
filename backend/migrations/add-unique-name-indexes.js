/**
 * Migration: Add unique indexes on name fields
 * This ensures no duplicate names for Crushers, Clients, Contractors, Suppliers, and Employees
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function addUniqueIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Collections to add unique indexes
        const collections = [
            { name: 'crushers', field: 'name' },
            { name: 'clients', field: 'name' },
            { name: 'contractors', field: 'name' },
            { name: 'suppliers', field: 'name' },
            { name: 'employees', field: 'name' }
        ];

        for (const collection of collections) {
            try {
                // Check if index already exists
                const indexes = await db.collection(collection.name).indexes();
                const hasUniqueIndex = indexes.some(idx => 
                    idx.key[collection.field] && idx.unique === true
                );

                if (hasUniqueIndex) {
                    console.log(`⏭️  Unique index on ${collection.name}.${collection.field} already exists`);
                    continue;
                }

                // Create unique index
                await db.collection(collection.name).createIndex(
                    { [collection.field]: 1 },
                    { unique: true, background: true }
                );
                console.log(`✅ Created unique index on ${collection.name}.${collection.field}`);

            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⚠️  Duplicate names found in ${collection.name}. Cleaning up...`);
                    
                    // Find duplicates
                    const duplicates = await db.collection(collection.name).aggregate([
                        { $group: { _id: `$${collection.field}`, count: { $sum: 1 }, ids: { $push: '$_id' } } },
                        { $match: { count: { $gt: 1 } } }
                    ]).toArray();

                    console.log(`   Found ${duplicates.length} duplicate name(s)`);

                    // For each duplicate, keep the first one and rename others
                    for (const dup of duplicates) {
                        const [keepId, ...duplicateIds] = dup.ids;
                        console.log(`   Keeping ${dup._id}, renaming ${duplicateIds.length} duplicate(s)`);

                        for (let i = 0; i < duplicateIds.length; i++) {
                            const newName = `${dup._id} (${i + 1})`;
                            await db.collection(collection.name).updateOne(
                                { _id: duplicateIds[i] },
                                { $set: { [collection.field]: newName } }
                            );
                            console.log(`   Renamed duplicate to: ${newName}`);
                        }
                    }

                    // Try creating index again
                    await db.collection(collection.name).createIndex(
                        { [collection.field]: 1 },
                        { unique: true, background: true }
                    );
                    console.log(`✅ Created unique index on ${collection.name}.${collection.field} after cleanup`);

                } else {
                    console.error(`❌ Error creating index on ${collection.name}.${collection.field}:`, error.message);
                }
            }
        }

        console.log('\n✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

// Run migration
addUniqueIndexes();
