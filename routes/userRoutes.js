const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const addressController = require('../controllers/addressController');
const coController = require('../controllers/coController');
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth/authMiddleware');
const {allowResubmit} = require('../middleware/auth/allowResubmit');
const upload = require('../middleware/upload');

// Get all pending users (Admin only)
router.get('/pending', authenticateToken, authorizeRoles('admin'), userController.getAllPendingUsers);

router.get('/address', addressController.getAddresses);

// Route untuk mengambil koordinat
router.get('/address/coordinates', addressController.getCoordinates);

// Update CO profile (CO only)
router.put('/captain/profile/edit', authenticateToken, authorizeRoles('co'), coController.updateCaptainProfile);
router.get('/captain/profile', authenticateToken, authorizeRoles('co'), coController.getCaptainProfile);
router.put('/resubmit', allowResubmit, upload.single('selfie_url'),  authController.resubmitProfile);
router.get('/profile/me/:userId', allowResubmit, authController.getCurrentUserProfile);

// Update Mitra profile (Mitra only)
router.put('/mitra-profile', authenticateToken, authorizeRoles('mitra'), userController.updateMitraProfile);

module.exports = router;
