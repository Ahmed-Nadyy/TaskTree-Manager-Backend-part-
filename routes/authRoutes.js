const express = require('express');
const { registerUser, loginUser, refreshToken, logoutUser,verifyToken } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken); 
router.post('/logout', logoutUser); 
router.get('/verify', verifyToken);

module.exports = router;
