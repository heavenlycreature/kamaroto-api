// src/api/routes/product.routes.js

const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitra/mitraController.js');
const productController = require('../controllers/mitra/productController.js');
const workshopController = require('../controllers/mitra/workshopController.js');
const auth = require('../middleware/auth/authMiddleware'); // Asumsi path middleware autentikasi
const ownership = require('../middleware/ownership'); // Asumsi path middleware kepemilikan
const productUpload = require('../middleware/images/productUpload.js');
const mechanicUpload = require('../middleware/images/mechanicUpload.js');
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
router.post('/mechanics', mechanicUpload, workshopController.createMechanic);
router.get('/mechanics', workshopController.getAllMechanics);
router.get('/mechanics/:mechanicId', ownership.canAccessMechanic, workshopController.getMechanicById);
router.put('/mechanics/:mechanicId', ownership.canAccessMechanic, mechanicUpload, workshopController.updateMechanic);
router.delete('/mechanics/:mechanicId', ownership.canAccessMechanic, workshopController.deleteMechanic);


module.exports = router;