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

/**
 * Middleware untuk memastikan mekanik yang diakses adalah milik Mitra yang sedang login.
 */
exports.canAccessMechanic = async (req, res, next) => {
    try {
        const mechanicId = req.params.mechanicId; // Kita akan gunakan `mechanicId` di rute
        const mitraProfileId = req.user.mitraProfile.id;

        if (!mitraProfileId) {
            return res.status(403).json({ message: 'Akses ditolak: Anda bukan Mitra.' });
        }

        const mechanic = await prisma.mechanic.findUnique({ where: { id: mechanicId } });

        if (!mechanic || mechanic.mitraProfileId !== mitraProfileId) {
            return res.status(404).json({ message: 'Mekanik tidak ditemukan atau Anda tidak memiliki akses.' });
        }
        
        // Simpan data mekanik di request untuk digunakan di controller (opsional)
        req.mechanic = mechanic;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};
