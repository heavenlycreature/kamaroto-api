const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');
const { authenticateToken, authorizeRoles } = require('../middleware/auth/authMiddleware');

router.post('/register/mitra', authController.registerMitra);
router.post('/register/captain', upload.single('selfie_url'), authController.registerCo);
router.post('/login', authController.loginUser);

module.exports = router;
