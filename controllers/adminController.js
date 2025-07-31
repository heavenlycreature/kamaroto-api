const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Mengambil daftar dan total Captain Officer (CO) yang sudah terverifikasi.
 * Kriteria: role = 'co', status = 'approved'
 */
exports.getVerifiedCo = async (req, res) => {
    try {
        const [verifiedCo, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: {
                    role: 'co',
                    status: 'approved'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    created_at: true,
                    coProfile: true // Sertakan profil lengkapnya
                }
            }),
            prisma.user.count({
                where: {
                    role: 'co',
                    status: 'approved'
                }
            })
        ]);

        res.status(200).json({
            message: "Data CO terverifikasi berhasil diambil.",
            total,
            data: verifiedCo
        });
    } catch (error) {
        console.error("Error fetching verified COs:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

/**
 * Mengambil daftar dan total Captain Officer (CO) yang menunggu persetujuan.
 * Kriteria: role = 'co', status = 'pending'
 */
exports.getPendingCo = async (req, res) => {
    try {
        const [pendingCo, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: {
                    role: 'co',
                    status: 'pending'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    created_at: true,
                    coProfile: true // Sertakan profil lengkapnya
                }
            }),
            prisma.user.count({
                where: {
                    role: 'co',
                    status: 'pending'
                }
            })
        ]);

        res.status(200).json({
            message: "Data CO pending berhasil diambil.",
            total,
            data: pendingCo
        });
    } catch (error) {
        console.error("Error fetching pending COs:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

/**
 * Mengambil daftar dan total Mitra yang terdaftar.
 * Kriteria: role = 'mitra' dan memiliki profil
 */
exports.getRegisteredMitra = async (req, res) => {
    try {
        const [mitras, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: {
                    role: 'mitra',
                    mitraProfile: {
                        isNot: null // Memastikan profil mitra ada
                    },
                    status: 'approved'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    mitraProfile: true,
                }
            }),
            prisma.user.count({
                where: {
                    role: 'mitra',
                    mitraProfile: {
                        isNot: null
                    },
                    status: 'approved'
                }
            })
        ]);
        
        res.status(200).json({
            message: "Data Mitra terdaftar berhasil diambil.",
            total,
            data: mitras
        });
    } catch (error) {
        console.error("Error fetching registered Mitras:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
/**
 * Mengambil daftar dan total Mitra yang memiliki status pending.
 * Kriteria: role = 'mitra' dan memiliki profil
 */
exports.getPendingMitra = async (req, res) => {
    try {
        const [mitras, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: {
                    role: 'mitra',
                     mitraProfile: {
                        isNot: null // Memastikan profil mitra ada
                    },
                    status: 'pending',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    mitraProfile: true,
                }
            }),
            prisma.user.count({
                where: {
                    role: 'mitra',
                     mitraProfile: {
                        isNot: null // Memastikan profil mitra ada
                    },
                    status: 'pending'
                }
            })
        ]);
        
        res.status(200).json({
            message: "Data Mitra terdaftar berhasil diambil.",
            total,
            data: mitras
        });
    } catch (error) {
        console.error("Error fetching registered Mitras:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

/**
 * Menyetujui pendaftaran user (CO atau Mitra) secara dinamis.
 */
exports.approveUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // Tentukan model profil yang akan di-update berdasarkan role user
        let profileModel;
        if (user.role === 'co') {
            profileModel = prisma.coProfile;
        } else if (user.role === 'mitra') {
            profileModel = prisma.mitraProfile;
        } else {
            // Jika role lain, cukup setujui user tanpa update profil
            await prisma.user.update({ where: { id: parseInt(userId) }, data: { status: 'active' } });
            return res.status(200).json({ message: `User ${user.role} berhasil diaktifkan.` });
        }

        // Jalankan update pada User dan Profil dalam satu transaksi
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: parseInt(userId) },
                data: { status: 'approved', resubmit_allowed: false },
            });
            await profileModel.update({
                where: { user_id: parseInt(userId) },
                data: { is_verified: true, approved_at: new Date() },
            });
        });

        res.status(200).json({ message: `User ${user.role} dengan ID ${userId} berhasil disetujui.` });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ message: 'Gagal menyetujui user.' });
    }
};

/**
 * Menolak pendaftaran user (CO atau Mitra) dengan alasan.
 */
exports.rejectUser = async (req, res) => {
    const { userId } = req.params;
    const { rejection_reason, resubmit_allowed } = req.body;

    if (!rejection_reason) {
        return res.status(400).json({ message: 'Alasan penolakan wajib diisi.' });
    }

    try {
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                status: 'rejected',
                rejection_reason,
                resubmit_allowed,
            },
        });
        res.status(200).json({ message: `User dengan ID ${userId} berhasil ditolak.` });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ message: 'Gagal menolak user.' });
    }
};
