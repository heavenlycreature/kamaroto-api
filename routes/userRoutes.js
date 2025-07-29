const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const addressController = require('../controllers/addressController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all pending users (Admin only)
router.get('/pending', authenticateToken, authorizeRoles('admin'), userController.getAllPendingUsers);

router.get('/address', addressController.getAddresses);

// Route untuk mengambil koordinat
router.get('/address/coordinates', addressController.getCoordinates);

// Approve a user (Admin only)
router.put('/:userId/approve', authenticateToken, authorizeRoles('admin'), userController.approveUser);

// Reject a user (Admin only)
router.put('/:userId/reject', authenticateToken, authorizeRoles('admin'), userController.rejectUser);

// Update CO profile (CO only)
router.put('/co-profile', authenticateToken, authorizeRoles('co'), userController.updateCoProfile);

// Update Mitra profile (Mitra only)
router.put('/mitra-profile', authenticateToken, authorizeRoles('mitra'), userController.updateMitraProfile);

module.exports = router;
