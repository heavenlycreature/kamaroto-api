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
                    created_at: true
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
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    created_at: true,
                    mitraProfile: { // Sertakan data spesifik dari profil mitra
                        select: {
                            business_type: true,
                            business_entity: true,
                            pic_name: true,
                            pic_phone: true
                        }
                    }
                }
            }),
            prisma.user.count({
                where: {
                    role: 'mitra',
                    mitraProfile: {
                        isNot: null
                    }
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