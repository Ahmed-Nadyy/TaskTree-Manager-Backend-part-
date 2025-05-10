const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    darkMode: { type: Boolean, default: false },
    role: { 
        type: String, 
        enum: ['solo', 'team', 'company'], 
        default: 'solo', 
        required: true 
    },
    isVerified: { type: Boolean, default: false },
    otp: {
        code: { type: String },
        createdAt: { type: Date },
        expiresAt: { type: Date }
    },
    teamMembers: [{
        email: { type: String },
        role: { type: String, enum: ['admin', 'member'], default: 'member' }
    }]
});

module.exports = mongoose.model('User', userSchema);
