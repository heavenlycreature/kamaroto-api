const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');
const { authenticateToken, authorizeRoles } = require('../middleware/auth/authMiddleware');

router.post('/register/mitra', upload.single('store_images'),authController.registerMitra);
router.post('/register/captain', upload.single('selfie_url'), authController.registerCo);
router.post('/login', authController.loginUser);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;
