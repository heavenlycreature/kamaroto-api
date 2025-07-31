const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); 

// Setiap request ke rute admin akan melewati dua lapis keamanan ini secara berurutan.
router.use(authenticateToken); // Lapis pertama: Pastikan user sudah login (memiliki token valid)
router.use(authorizeRoles('admin')); // Lapis kedua: Pastikan user yang login memiliki peran 'admin'

// 3. Rute-rute untuk admin
// Rute ini sekarang secara otomatis aman dan hanya bisa diakses oleh admin.
// Captain Officer (CO) Route List
router.get('/co/verified', adminController.getVerifiedCo);
router.get('/co/pending', adminController.getPendingCo);
router.put('/co/approved/:userId', adminController.approveUser);
router.put('/co/rejected/:userId', adminController.rejectUser);
// Mitra Route List
router.get('/mitra/registered', adminController.getRegisteredMitra);
router.get('/mitra/pending', adminController.getPendingMitra);
router.put('/mitra/approved/:userId', adminController.approveUser);
router.put('/mitra/rejected/:userId', adminController.rejectUser);

module.exports = router;