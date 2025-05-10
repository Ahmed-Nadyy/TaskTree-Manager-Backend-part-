const express = require('express');
const { registerUser, loginUser, refreshToken, logoutUser, verifyToken, updateDarkMode, verifyOTP, resendOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/refresh', refreshToken); 
router.post('/logout', logoutUser); 
router.get('/verify', verifyToken);
router.put('/darkmode', protect, updateDarkMode); 

module.exports = router;
