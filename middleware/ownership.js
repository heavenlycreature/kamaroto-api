// src/api/middlewares/ownership.middleware.js
const {Prisma, PrismaClient } = require('@prisma/client'); // Sesuaikan path ke prisma client Anda
const prisma = new PrismaClient();
// Middleware untuk memastikan produk milik toko si Mitra
exports.canAccessProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const mitraProfileId = req.user.mitraProfile.id;

        if (!mitraProfileId) {
            return res.status(403).json({ message: 'Akses ditolak: Anda bukan Mitra.' });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product || product.mitraProfileId !== mitraProfileId) {
            return res.status(404).json({ message: 'Produk tidak ditemukan atau Anda tidak memiliki akses.' });
        }
        
        // Jika lolos, teruskan ke controller
        next();
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};
