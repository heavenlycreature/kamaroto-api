const productService = require('../../services/mitra/productService');

/**
 * Membuat produk baru berdasarkan data dari body request.
 */
exports.createProduct = async (req, res) => {
    try {
        // ID toko diambil dari data user yang sudah diverifikasi oleh middleware auth
        const mitraProfileId = req.user.mitraProfile.id;
        const productData = req.body;
        const files = req.files; 
        
        if (productData.vehicleDetail) {
            productData.vehicleDetail = JSON.parse(productData.vehicleDetail);
        }


        const product = await productService.createProduct(mitraProfileId, productData, files);
        
        res.status(201).json({ message: 'Produk berhasil dibuat.', data: product });
    } catch (error) {
        // Tangani error validasi dari service
        res.status(400).json({ message: error.message });
    }
};

/**
 * Mengambil daftar produk untuk toko milik Mitra yang sedang login.
 */
exports.getMyProducts = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const products = await productService.getProductsByStore(mitraProfileId);
        res.status(200).json({ data: products });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data produk.', error: error.message });
    }
};

/**
 * Mengambil detail satu produk berdasarkan ID.
 */
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        res.status(200).json({ data: product });
    } catch (error) {
        // findUniqueOrThrow akan melempar error jika tidak ditemukan
        res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }
};

/**
 * Memperbarui data produk.
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;
        const files = req.files; 
        
        if (productData.vehicleDetail) {
            productData.vehicleDetail = JSON.parse(productData.vehicleDetail);
        }

        const updatedProduct = await productService.updateProduct(id, productData, files);
        res.status(200).json({ message: 'Produk berhasil diperbarui.', data: updatedProduct });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Menghapus produk.
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await productService.deleteProduct(id);
        // Status 204 No Content adalah standar untuk delete yang berhasil
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus produk.', error: error.message });
    }
};

