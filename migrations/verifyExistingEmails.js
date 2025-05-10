require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyExistingEmails() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Update all existing users where isVerified is not already true
        const result = await User.updateMany(
            { isVerified: { $ne: true } },
            { $set: { isVerified: true } }
        );

        console.log(`Successfully verified ${result.modifiedCount} users`);
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error in migration:', error);
        process.exit(1);
    }
}

verifyExistingEmails();
