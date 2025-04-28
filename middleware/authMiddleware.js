const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    try {
        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token) {
                throw new Error('No token provided in Authorization header');
            }

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    throw new Error('Token has expired');
                }
                throw new Error('Invalid token');
            }
            
            // Add user to request object (without password)
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                throw new Error('User not found');
            }

            // Add user and additional validation info to request
            req.user = user;
            req.tokenExp = decoded.exp;
            
            // Check if token is about to expire (within 5 minutes)
            const fiveMinutes = 5 * 60;
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp - currentTime < fiveMinutes) {
                req.tokenNearingExpiry = true;
            }

            next();
        } else {
            throw new Error('No authorization token provided');
        }
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ 
            message: 'Not authorized', 
            error: error.message,
            code: error.message.includes('expired') ? 'TOKEN_EXPIRED' : 'AUTH_ERROR'
        });
    }
};

module.exports = { protect };
