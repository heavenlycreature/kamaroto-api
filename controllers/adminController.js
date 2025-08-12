const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/mailer')


function generateReferralCode(length = 8) {
      return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
}



/**
 * Mengambil daftar dan total pengguna (CO atau Mitra) dengan status 'pending'.
 * Secara dinamis menyertakan informasi referrer jika ada.
 */
exports.getPendingUsers = async (req, res) => {
    // Tentukan role berdasarkan path URL (misal: '/co/pending' -> 'co')
    const role = req.path.includes('/co/') ? 'co' : 'mitra';

    try {
        const whereClause = {
            role: role,
            status: 'pending',
            // Pastikan profil yang sesuai ada
            [role === 'co' ? 'coProfile' : 'mitraProfile']: {
                isNot: null
            }
        };

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    status: true,
                    email_is_verified: true, // Ambil status verifikasi email
                    created_at: true,
                    coProfile: role === 'co', // Hanya sertakan coProfile jika role = 'co'
                    mitraProfile: role === 'mitra', // Hanya sertakan mitraProfile jika role = 'mitra'
                    
                    // --- PERUBAHAN UTAMA DI SINI ---
                    // Ambil data referral yang terhubung dengan user ini
                    referred: {
                        select: {
                            // Dari data referral, ambil data si pemberi referral
                            referrer: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.user.count({ where: whereClause })
        ]);
        
        // Format ulang data agar lebih mudah digunakan di frontend
        const formattedData = users.map(user => {
            const { referred, ...restOfUser } = user;
            // Jika ada data referral, ambil objek referrer-nya. Jika tidak, set ke null.
            const referrerInfo = (referred && referred.length > 0)
                ? referred[0].referrer
                : null;
            
            return {
                ...restOfUser,
                referrer: referrerInfo // Tambahkan properti 'referrer'
            };
        });

        res.status(200).json({
            message: `Data ${role.toUpperCase()} pending berhasil diambil.`,
            total,
            data: formattedData
        });
    } catch (error) {
        console.error(`Error fetching pending ${role.toUpperCase()}:`, error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};


/**
 * Mengambil daftar dan total Captain Officer (CO) yang sudah terverifikasi.
 * Kriteria: role = 'co', status = 'approved'
 */
exports.getVerifiedCo = async (req, res) => {
    try {
        const [verifiedCo, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: { role: 'co', status: 'approved' },
                select: {
                    id: true, name: true, email: true, phone: true, created_at: true,
                    coProfile: true,
                    referred: {
                        select: {
                            referrer: {
                                select: { id: true, name: true, email: true }
                            }
                        }
                    }
                }
            }),
            prisma.user.count({ where: { role: 'co', status: 'approved' } })
        ]);

        const formattedData = verifiedCo.map(user => {
            const { referred, ...restOfUser } = user;
            const referrerInfo = (referred && referred.length > 0) ? referred[0].referrer : null;
            return { ...restOfUser, referrer: referrerInfo };
        });

        res.status(200).json({
            message: "Data CO terverifikasi berhasil diambil.",
            total,
            data: formattedData 
        });
    } catch (error) {
        console.error("Error fetching verified COs:", error);
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
                where: { role: 'mitra', status: 'approved', mitraProfile: { isNot: null } },
                select: {
                    id: true, name: true, email: true, phone: true, status: true, created_at: true,
                    mitraProfile: true,
                    // --- PERBAIKAN: Tambahkan query untuk mengambil data referrer ---
                    referred: {
                        select: {
                            referrer: {
                                select: { id: true, name: true, email: true }
                            }
                        }
                    }
                }
            }),
            prisma.user.count({ where: { role: 'mitra', status: 'approved', mitraProfile: { isNot: null } } })
        ]);
        
        // --- PERBAIKAN: Format data agar mudah digunakan di frontend ---
        const formattedData = mitras.map(user => {
            const { referred, ...restOfUser } = user;
            const referrerInfo = (referred && referred.length > 0) ? referred[0].referrer : null;
            return { ...restOfUser, referrer: referrerInfo };
        });

        res.status(200).json({
            message: "Data Mitra terdaftar berhasil diambil.",
            total,
            data: formattedData // Kirim data yang sudah diformat
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

        
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: parseInt(userId) },
                data: { status: 'approved', resubmit_allowed: false },
            });
            await profileModel.update({
                where: { user_id: parseInt(userId) },
                data: { is_verified: true, approved_at: new Date() },
            });
            if (user.role === 'co') {
                    await tx.coProfile.update({
                        where: { user_id: parseInt(userId) },
                        data: { referral_code: generateReferralCode() }
                    });
            }

            const referral = await tx.referral.findFirst({
                where: {
                    referred_id: parseInt(userId),
                    rewarded: false,
                }
            });
            if (referral) {
                await tx.point.create({
                    data: {
                        user_id: referral.referrer_id,
                        amount: referral.reward_point,
                        type: 'referral',
                        description: `Reward referral untuk pendaftaran ${user.name}`
                    }
                });
                await tx.referral.update({
                    where: { id: referral.id },
                    data: { rewarded: true }
                });
            }
        });

        try {
            await sendApprovalEmail(user.email, user.name);
        } catch (emailError) {
            console.log(`Persetujuan user ID ${userId} berhasil, namun gagal mengirim email notifikasi.`);
        }
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
        const user = await prisma.user.findUnique({ 
            where: { id: parseInt(userId) } 
        });

        // Tambahkan validasi jika user tidak ditemukan
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                status: 'rejected',
                rejection_reason,
                resubmit_allowed,
            },
        });

         try {
            await sendRejectionEmail(user.email, user.name, rejection_reason, resubmit_allowed);
        } catch (emailError) {
            console.error(`Penolakan user ID ${userId} berhasil, namun gagal mengirim email notifikasi.`);
        }
        res.status(200).json({ message: `User dengan ID ${userId} berhasil ditolak.` });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ message: 'Gagal menolak user.' });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        res.status(200).json({ data: settings });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil pengaturan." });
    }
};

exports.updateSettings = async (req, res) => {
    // Harapkan body berupa array: [{ key: 'referral_reward_co' || 'referral_reward_mitra', value: 'new_value' }]
    const settingsToUpdate = req.body; 

    if (!Array.isArray(settingsToUpdate)) {
        return res.status(400).json({ message: "Format input tidak valid." });
    }

    const numericSettingKeys = ['referral_reward_co', 'referral_reward_mitra'];
     for (const setting of settingsToUpdate) {
        if (numericSettingKeys.includes(setting.key)) {
            if (isNaN(parseInt(setting.value, 10))) {
                return res.status(400).json({ 
                    message: `Nilai untuk pengaturan '${setting.key}' harus berupa angka.` 
                });
            }
        }
    }
    try {
          const updatePromises = settingsToUpdate.map(setting => 
            prisma.setting.upsert({
                where: { key: setting.key }, // Kondisi untuk mencari
                // Data yang akan di-update JIKA ditemukan
                update: { 
                    value: setting.value 
                },
                // Data yang akan dibuat JIKA TIDAK ditemukan
                create: {
                    key: setting.key,
                    value: setting.value,
                    // Anda bisa menambahkan deskripsi default jika perlu
                    description: `Pengaturan untuk ${setting.key}`
                },
            })
        );

        await prisma.$transaction(updatePromises);
        
        res.status(200).json({ message: "Pengaturan berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui pengaturan." });
    }
};