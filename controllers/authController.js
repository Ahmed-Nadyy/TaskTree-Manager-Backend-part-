const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { generateOTP, isOTPExpired } = require('../utils/otpService');
const { sendOTPEmail, verifyTransporter } = require('../utils/emailService');
const rateLimit = require('express-rate-limit');

// IMPORTANT: In a production environment, refresh tokens should be stored in a persistent database (e.g., Redis, MongoDB)
// not in an in-memory array, as this will be cleared on server restart and does not scale.
let refreshTokens = []; 

// Rate limiting for login and OTP requests
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many OTP requests from this IP, please try again after 5 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Generate Access Token (Short-lived)
const generateAccessToken = (user) => {
    return jwt.sign({ 
        userId: user._id, 
        role: user.role 
    }, process.env.ACCESS_TOKEN_SECRET, { 
        expiresIn: "30m" 
    });
};

// Generate Refresh Token (Long-lived)
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign({ 
        userId: user._id,
        role: user.role
    }, process.env.REFRESH_TOKEN_SECRET, { 
        expiresIn: "7d" 
    });
    refreshTokens.push(refreshToken);
    return refreshToken;
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Email not found" });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: "Please verify your email first" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });        res.json({
            accessToken,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                darkMode: user.darkMode
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Refresh Token Route
const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("Refresh Token:", refreshToken);
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = generateAccessToken({ userId: user.userId });
        res.json({ accessToken: newAccessToken });
    });
};

// Logout Route
const logoutUser = (req, res) => {
    refreshTokens = refreshTokens.filter((token) => token !== req.cookies.refreshToken);
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
};

// Verify Token Route
const verifyToken = async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];  

    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Token is valid', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                darkMode: user.darkMode
            }
        });
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Add new endpoint to update dark mode preference
const updateDarkMode = async (req, res) => {
    try {
        const { darkMode } = req.body;
        const userId = req.user._id;  // Get user ID from auth middleware

        const user = await User.findByIdAndUpdate(
            userId,
            { darkMode },
            { new: true }
        );

        res.json({
            success: true,
            darkMode: user.darkMode
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Register new user with OTP
const registerUser = async (req, res) => {
    console.log('Registration request received:', req.body);
    const { name, email, password, role = 'solo' } = req.body;

    try {
        // Verify email service first
        const isEmailServiceReady = await verifyTransporter();
        if (!isEmailServiceReady) {
            return res.status(500).json({ error: "Email service is not available" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user with unverified status
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            isVerified: false,
            otp: {
                code: otp,
                createdAt: new Date(),
                expiresAt: otpExpiry
            }
        });

        await user.save();
        console.log('User saved successfully:', user._id);

        // Send OTP email
        await sendOTPEmail(email, otp);
        console.log('OTP email sent successfully');

        res.status(201).json({ 
            message: "Registration successful. Please check your email for verification code.",
            userId: user._id 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: "Registration failed", 
            details: error.message 
        });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    console.log('OTP verification request received:', req.body);
    const { userId, otp } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        if (!user.otp || !user.otp.code || isOTPExpired(user.otp.expiresAt)) {
            return res.status(400).json({ error: "OTP expired" });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // Verify user and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        await user.save();
        console.log('User verified successfully:', user._id);

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        res.json({
            message: "Email verified successfully",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                darkMode: user.darkMode,
                role: user.role
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            error: "Verification failed",
            details: error.message 
        });
    }
};

// Resend OTP
const resendOTP = async (req, res) => {
    console.log('Resend OTP request received:', req.body);
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = {
            code: otp,
            createdAt: new Date(),
            expiresAt: otpExpiry
        };
        await user.save();
        console.log('New OTP generated for user:', user._id);

        // Send new OTP email
        await sendOTPEmail(user.email, otp);
        console.log('New OTP email sent successfully');

        res.json({ message: "New verification code sent successfully" });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ 
            error: "Failed to resend verification code",
            details: error.message 
        });
    }
};

module.exports = {
    registerUser: [otpLimiter, registerUser],
    loginUser: [authLimiter, loginUser],
    refreshToken,
    logoutUser,
    verifyToken,
    updateDarkMode,
    verifyOTP: [otpLimiter, verifyOTP],
    resendOTP: [otpLimiter, resendOTP]
};
