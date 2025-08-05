const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth/authMiddleware'); 

// Setiap request ke rute admin akan melewati dua lapis keamanan ini secara berurutan.
router.use(authenticateToken); // Lapis pertama: Pastikan user sudah login (memiliki token valid)
router.use(authorizeRoles('admin')); // Lapis kedua: Pastikan user yang login memiliki peran 'admin'

// 3. Rute-rute untuk admin
// Rute ini sekarang secara otomatis aman dan hanya bisa diakses oleh admin.
// Captain Officer (CO) Route List
router.get('/co/verified', adminController.getVerifiedCo);
router.get('/co/pending', adminController.getPendingUsers);
router.put('/co/approved/:userId', adminController.approveUser);
router.put('/co/rejected/:userId', adminController.rejectUser);
// Mitra Route List
router.get('/mitra/registered', adminController.getRegisteredMitra);
router.get('/mitra/pending', adminController.getPendingUsers);
router.put('/mitra/approved/:userId', adminController.approveUser);
router.put('/mitra/rejected/:userId', adminController.rejectUser);
// set referral point
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;