const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.authenticateToken = async (req, res, next) => {
     let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // [PENYESUAIAN PENTING] Gunakan `include` untuk mengambil profil terkait
            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    // Sertakan objek mitraProfile, tapi kita hanya butuh ID-nya
                    mitraProfile: {
                        select: {
                            id: true 
                        }
                    }
                    // Anda bisa menambahkan coProfile di sini jika diperlukan untuk rute lain
                }
            });
            
            if (!req.user) {
                return res.status(401).json({ message: 'Token tidak valid, pengguna tidak ditemukan.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Tidak terautentikasi, token gagal.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Tidak terautentikasi, tidak ada token.' });
    }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. You do not have the necessary permissions.' });
    }
    next();
  };
};

exports.isMitra = (req, res, next) => {
    // Middleware ini mengasumsikan `req.user` sudah diisi oleh `verifyToken`
    if (req.user && req.user.role === 'mitra') {
        // Jika peran user adalah MITRA, lanjutkan ke handler berikutnya
        next();
    } else {
        // Jika tidak, kirim respons 403 Forbidden (Akses Ditolak)
        return res.status(403).json({
            message: 'Akses ditolak. Rute ini hanya untuk pengguna dengan peran Mitra.'
        });
    }
};