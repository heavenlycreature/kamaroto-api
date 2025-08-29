// src/api/routes/product.routes.js

const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitra/mitraController.js');
const productController = require('../controllers/mitra/productController.js');
const operationController = require('../controllers/mitra/operationController.js');
const auth = require('../middleware/auth/authMiddleware'); // Asumsi path middleware autentikasi
const ownership = require('../middleware/ownership'); // Asumsi path middleware kepemilikan
const productUpload = require('../middleware/images/productUpload.js');
const staffUpload = require('../middleware/images/staffUpload.js');
const storeAssetUpload = require('../middleware/images/storeAssetUpload.js');

router.use(auth.authenticateToken, auth.isMitra);


router.put('/store/info', storeAssetUpload , mitraController.updateStoreInfo);

/**
 * @route   POST /api/products
 * @desc    Membuat produk baru (Kendaraan atau Sparepart)
 * @access  Private (Mitra)
 */
router.post('/products',productUpload.array('mediaFiles', 10), productController.createProduct);

/**
 * @route   GET /api/products
 * @desc    Mendapatkan semua produk milik Mitra yang sedang login
 * @access  Private (Mitra)
 */
router.get('/products', productController.getMyProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Mendapatkan detail satu produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.get('/products/:id', ownership.canAccessProduct, productController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Memperbarui produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.put('/products/:id', ownership.canAccessProduct, productUpload.array('mediaFiles', 10), productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Menghapus produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.delete('/products/:id', ownership.canAccessProduct, productController.deleteProduct);

// --- Rute untuk Mekanik ---
router.post('/staff', staffUpload, operationController.createStaff);
// GET /api/operations/staff?role=MECHANIC
// GET /api/operations/staff?role=WASHER
router.get('/staff', operationController.getAllStaff);
router.get('/staff/:staffId', ownership.canAccessStaff, operationController.getStaffById);
router.put('/staff/:staffId', ownership.canAccessStaff, staffUpload, operationController.updateStaff);
router.delete('/staff/:staffId', ownership.canAccessStaff, operationController.deleteStaff);

/**
 * @route   GET /api/workshop/slots?date=YYYY-MM-DD
 * @desc    Mendapatkan semua slot untuk tanggal tertentu
 * @access  Private (Mitra)
 */
router.get('/slots', operationController.getWorkshopSlotsByDate);

/**
 * @route   PUT /api/workshop/slots
 * @desc    Membuat atau memperbarui satu slot waktu (Upsert)
 * @access  Private (Mitra)
 */
router.put('/slots', operationController.upsertWorkshopSlot);

/**
 * @route   POST /api/workshop/slots/bulk-update
 * @desc    Membuat atau memperbarui beberapa slot sekaligus
 * @access  Private (Mitra)
 */
router.post('/slots/bulk-update', operationController.bulkUpdateWorkshopSlots);

// --- Rute untuk Slot Cuci Kendaraan (Wash) ---

/**
 * @route   GET /api/workshop/wash-slots?date=YYYY-MM-DD
 * @desc    Mendapatkan semua slot cuci untuk tanggal tertentu
 * @access  Private (Mitra)
 */
router.get('/wash-slots', operationController.getWashSlotsByDate);

/**
 * @route   PUT /api/workshop/wash-slots
 * @desc    Membuat atau memperbarui satu slot cuci (Upsert)
 * @access  Private (Mitra)
 */
router.put('/wash-slots', operationController.upsertWashSlot);

/**
 * @route   POST /api/workshop/wash-slots/bulk-update
 * @desc    Membuat atau memperbarui beberapa slot cuci sekaligus
 * @access  Private (Mitra)
 */
router.post('/wash-slots/bulk-update', operationController.bulkUpdateWashSlots);



module.exports = router;