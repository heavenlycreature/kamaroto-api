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

/**
 * Menyetujui pendaftaran user (hanya mengubah status).
 */
exports.approveUserCo = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User ini sudah disetujui sebelumnya.' });
    }
    
    // Logika persetujuan disederhanakan: HANYA update status
    // Profil sudah ada sejak pendaftaran
    const approvedStatus = (user.role === 'mitra' || user.role === 'co') ? 'approved' : 'active';

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { status: approvedStatus },
      select: { id: true, email: true, role: true, status: true }
    });

    res.status(200).json({ message: `User ${user.role} berhasil disetujui.`, user: updatedUser });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menyetujui user.' });
  }
};

/**
 * Menolak pendaftaran user.
 * (Logika ini sudah cukup baik, hanya dirapikan sedikit)
 */
exports.rejectUserCo = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { status: 'rejected' },
      select: { id: true, email: true, role: true, status: true }
    });

    res.status(200).json({ message: 'User berhasil ditolak.', user: updatedUser });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menolak user.' });
  }
};
