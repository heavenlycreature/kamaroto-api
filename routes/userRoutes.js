const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const addressController = require('../controllers/addressController');
const coController = require('../controllers/coController');
const mitraController = require('../controllers/mitraController');
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
router.get('/captain/referrals', authenticateToken, authorizeRoles('co'), coController.getReferredUsers);
router.get('/captain/referrals/stats', authenticateToken, authorizeRoles('co'), coController.getReferralStats);

// Update Mitra profile (Mitra only)
router.put('/mitra/profile/edit', authenticateToken, authorizeRoles('mitra'), mitraController.updateMitraProfile);
router.get('/mitra/profile', authenticateToken, authorizeRoles('mitra'), mitraController.getMitraProfile);

// Route for resubmit both co/mitra
router.put('/resubmit', allowResubmit, upload.single('selfie_url'),  authController.resubmitProfile);
router.get('/profile/me/:userId', allowResubmit, authController.getCurrentUserProfile);

module.exports = router;
