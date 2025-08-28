// src/api/routes/product.routes.js

const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitraController');
const auth = require('../middleware/auth/authMiddleware'); // Asumsi path middleware autentikasi
const ownership = require('../middleware/ownership'); // Asumsi path middleware kepemilikan
const productUpload = require('../middleware/images/productUpload.js');
const storeAsset = require('../middleware/images/storeAsset.js');

router.use(auth.authenticateToken, auth.isMitra);


router.put('/store/info', storeAsset , mitraController.updateStoreInfo);

/**
 * @route   POST /api/products
 * @desc    Membuat produk baru (Kendaraan atau Sparepart)
 * @access  Private (Mitra)
 */
router.post('/products',productUpload.array('mediaFiles', 10), mitraController.createProduct);

/**
 * @route   GET /api/products
 * @desc    Mendapatkan semua produk milik Mitra yang sedang login
 * @access  Private (Mitra)
 */
router.get('/products', mitraController.getMyProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Mendapatkan detail satu produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.get('/products/:id', ownership.canAccessProduct, mitraController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Memperbarui produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.put('/products/:id', ownership.canAccessProduct, productUpload.array('mediaFiles', 10), mitraController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Menghapus produk
 * @access  Private (Mitra, dengan verifikasi kepemilikan)
 */
router.delete('/products/:id', ownership.canAccessProduct, mitraController.deleteProduct);

module.exports = router;