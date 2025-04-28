const express = require('express');
const { registerUser, loginUser, refreshToken, logoutUser, verifyToken, updateDarkMode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken); 
router.post('/logout', logoutUser); 
router.get('/verify', verifyToken);
router.put('/darkmode', protect, updateDarkMode); // New protected route for updating dark mode

module.exports = router;
