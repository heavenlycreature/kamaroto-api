const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Impor middleware dari file yang sesuai
// (Asumsi file middleware Anda bernama 'authMiddleware.js' di folder 'middleware')
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); 

// 2. Terapkan middleware ke semua rute di bawahnya
// Setiap request ke rute admin akan melewati dua lapis keamanan ini secara berurutan.
router.use(authenticateToken); // Lapis pertama: Pastikan user sudah login (memiliki token valid)
router.use(authorizeRoles('admin')); // Lapis kedua: Pastikan user yang login memiliki peran 'admin'

// 3. Rute-rute untuk admin
// Rute ini sekarang secara otomatis aman dan hanya bisa diakses oleh admin.
router.get('/co/verified', adminController.getVerifiedCo);
router.get('/co/pending', adminController.getPendingCo);
router.get('/mitra/registered', adminController.getRegisteredMitra);


module.exports = router;