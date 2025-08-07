const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path'); 
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const prisma = new PrismaClient();


async function validateReferral(referralCode) {
    if (!referralCode) return null;

    const sanitizedCode = referralCode.trim().toLowerCase();

    const referrerProfile = await prisma.coProfile.findUnique({
        where: { referral_code: sanitizedCode },
        include: { user: true },
    });

    if (!referrerProfile || referrerProfile.user.status !== 'approved') {
        throw new Error("Kode referral tidak valid atau tidak aktif.");
    }
    return referrerProfile.user.id; // Kembalikan ID referrer
}

async function getSettingValue(key) {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) throw new Error(`Setting dengan key '${key}' tidak ditemukan.`);
    // Kembalikan sebagai angka
    return parseInt(setting.value, 10);
}

/**
 * Mendaftarkan user Mitra baru beserta profilnya dalam satu transaksi.
 */
exports.registerMitra = async (req, res) => {
  // 1. Ambil semua data dari body (user & profile)
  const {
    password, // Data untuk tabel 'users'
    // Data untuk tabel 'mitra_profiles'
    referral_code, pic_name, pic_phone, pic_email, pic_status,
    owner_name, owner_phone, owner_email, owner_ktp,
    owner_address_province, owner_address_city, owner_address_subdistrict, owner_address_village, owner_address_detail,
    business_type, business_entity, business_name,
    business_address_province, business_address_city, business_address_subdistrict, business_address_village, business_address_detail,
    business_duration, social_media_platform, social_media_account, latitude, longitude
  } = req.body;

   if (!req.file) {
    return res.status(400).json({ message: 'Gambar selfie wajib diunggah.' });
  }
   
  const store_images = `/uploads/stores/${req.file.filename}`;

  try {
    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const referrerId = await validateReferral(referral_code);
    // Gunakan nested write untuk membuat User dan MitraProfile sekaligus (transaksional)
    const newUser = await prisma.user.create({
      data: {
        name: owner_name,
        email: owner_email,
        password: hashedPassword,
        phone: owner_phone,
        role: 'mitra',
        status: 'pending', // Status default adalah pending
        mitraProfile: {
          create: {
            pic_name, pic_phone, pic_email, pic_status,
            owner_name, owner_phone, owner_email, owner_ktp,
            owner_address_province, owner_address_city, owner_address_subdistrict, owner_address_village, owner_address_detail,
            business_type, business_entity, business_name,
            business_address_province, business_address_city, business_address_subdistrict, business_address_village, business_address_detail,
            business_duration, social_media_platform, social_media_account,
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude),
            store_images 
          },
        },
      },
      // Pilih data yang ingin dikembalikan
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (referrerId) {
      const rewardPoint = await getSettingValue('referral_reward_co');
            await prisma.referral.create({
                data: {
                    referrer_id: referrerId,
                    referred_id: newUser.id,
                    type: 'co',
                    reward_point: rewardPoint,
                }
            });
      }
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 3600 * 1000);

        await prisma.verificationToken.create({
            data: {
                token: verificationToken,
                type: 'EMAIL_VERIFICATION',
                expires_at: expiresAt,
                user_id: newUser.id,
            }
        });

        await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({ message: 'Pendaftaran mitra berhasil, menunggu persetujuan admin.', user: newUser });

  } catch (error) {

    if (req.file) {
      try {
        await fs.unlink(req.file.path); // req.file.path berisi path lengkap ke file
        console.log(`File ${req.file.filename} dihapus karena registrasi gagal.`);
      } catch (unlinkError) {
        // Jika penghapusan file juga gagal, cukup log error-nya
        console.error(`Error saat menghapus file ${req.file.filename}:`, unlinkError);
      }
    }
    // Tangani error jika email sudah ada (Prisma error code P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ message: 'Email ini sudah terdaftar.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

/**
 * Mendaftarkan user CO (Credit Officer) baru beserta profilnya dalam satu transaksi.
 */
exports.registerCo = async (req, res) => {
  const {
    name, email, password, phone, nik,
    birth_place, birth_date, gender,
    address_province, address_city, referral_code, address_subdistrict, address_village, address_detail,
    job, marital_status, education, latitude, longitude 
  } = req.body;

  // Cek apakah file diunggah
  if (!req.file) {
    return res.status(400).json({ message: 'Gambar selfie wajib diunggah.' });
  }

  const birthDateObject = new Date(`${birth_date}T00:00:00.000Z`); // Ubah string menjadi objek Date
    if (isNaN(birthDateObject.getTime())) {
      // Jika string tidak valid (misal: "ini-bukan-tanggal"), kirim error yang jelas
      return res.status(400).json({ 
          message: "Format tanggal lahir tidak valid. Harap gunakan format yang sesuai" 
      });
    }

  // Buat URL yang bisa diakses publik dari nama file
  const selfie_url = `/uploads/selfies/${req.file.filename}`;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const referrerId = await validateReferral(referral_code);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'co',
        status: 'pending',
        coProfile: {
          create: {
            name,
            email,
            nik,
            birth_place,
            birth_date: birthDateObject,
            gender,
            address_province,
            address_city,
            address_subdistrict,
            address_village,
            address_detail,
            job,
            marital_status,
            education,
            selfie_url: selfie_url,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        },
      },
      select: { id: true, email: true, status: true }
    });
     if (referrerId) {
      const rewardPoint = await getSettingValue('referral_reward_co');
            await prisma.referral.create({
                data: {
                    referrer_id: referrerId,
                    referred_id: newUser.id,
                    type: 'co',
                    reward_point: rewardPoint, // Contoh poin
                }
            });
        }

        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 3600 * 1000);

        await prisma.verificationToken.create({
            data: {
                token: verificationToken,
                type: 'EMAIL_VERIFICATION', // Gunakan tipe yang baru kita buat
                expires_at: expiresAt,
                user_id: newUser.id,
            }
        });

        await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({ message: 'Pendaftaran CO berhasil, menunggu persetujuan admin.', user: newUser });

  } catch (error) {
    // 1. Hapus file yang sudah terlanjur di-upload jika ada error database
    if (req.file) {
      try {
        await fs.unlink(req.file.path); // req.file.path berisi path lengkap ke file
        console.log(`File ${req.file.filename} dihapus karena registrasi gagal.`);
      } catch (unlinkError) {
        // Jika penghapusan file juga gagal, cukup log error-nya
        console.error(`Error saat menghapus file ${req.file.filename}:`, unlinkError);
      }
    }

    // 2. Kirim respons error yang sesuai ke frontend
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const field = error.meta.target[0];
        return res.status(400).json({
            message: `Data pada kolom '${field}' sudah digunakan.`,
            field: field 
        });
    }
     if (error.message.includes("Kode referral tidak valid")) {
            return res.status(400).json({ message: error.message, field: 'referral_code' });
        }
    
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

// Fungsi baru untuk mengambil profil lengkap user yang sedang login
exports.getCurrentUserProfile = async (req, res) => {
    // SOLUSI: Ambil id dan role dari req.user (token), BUKAN req.params.
    const { id: userId, role } = req.user; 

    try {
        let includeClause = {};
        if (role === 'co') {
            includeClause = { coProfile: true };
        } else if (role === 'mitra') {
            includeClause = { mitraProfile: true };
        } else {
            return res.status(400).json({ message: "Role pengguna tidak valid untuk operasi ini." });
        }

        const userWithProfile = await prisma.user.findUnique({
            where: { id: userId }, // Gunakan userId dari token
            // Gunakan 'select' untuk keamanan, agar tidak mengirim hash password
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                rejection_reason: true,
                resubmit_allowed: true,
                coProfile: includeClause.coProfile,
                mitraProfile: includeClause.mitraProfile,
            }
        });

        if (!userWithProfile) {
            return res.status(404).json({ message: "Profil tidak ditemukan." });
        }

        res.status(200).json(userWithProfile);
    } catch (error) {
        console.error("Get current user profile error:", error);
        res.status(500).json({ message: "Gagal mengambil data profil." });
    }
};


/**
 * Logic untuk menhandle resubmit profile
 */

exports.resubmitProfile = async (req, res) => {
    const { id: userId, role } = req.user; 
    const allData = req.body; // Ambil semua data dari body

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== 'rejected' || !user.resubmit_allowed) {
            return res.status(403).json({ message: 'Anda tidak diizinkan untuk melakukan pendaftaran ulang.' });
        }
        
        // --- SOLUSI: Pisahkan data untuk setiap tabel ---
        
        // 1. Siapkan data HANYA untuk tabel User
        const userDataForUpdate = {
            name: allData.name,
            email: allData.email,
            phone: allData.phone,
        };

        // 2. Siapkan data HANYA untuk tabel Profil secara dinamis
        let profileDataForUpdate = {};
        let profileModel;
         if (req.file && role === 'co') { // Hanya berlaku jika ada file BARU yang diupload
            const existingProfile = await prisma.coProfile.findUnique({
                where: { user_id: userId },
                select: { selfie_url: true }
            });

            if (existingProfile && existingProfile.selfie_url) {
                const oldFilePath = path.join(__dirname, '..', 'public', existingProfile.selfie_url);
                try {
                    await fs.unlink(oldFilePath);
                    console.log(`File lama ${existingProfile.selfie_url} berhasil dihapus.`);
                } catch (unlinkError) {
                    console.error(`Gagal menghapus file lama: ${oldFilePath}`, unlinkError);
                }
            }
        }

        if (role === 'co') {
            profileModel = prisma.coProfile;
            profileDataForUpdate = {
                name: allData.name,
                email: allData.email,
                nik: allData.nik,
                birth_place: allData.birth_place,
                birth_date: new Date(allData.birth_date),
                gender: allData.gender,
                address_province: allData.address_province,
                address_city: allData.address_city,
                address_subdistrict: allData.address_subdistrict,
                address_village: allData.address_village,
                address_detail: allData.address_detail,
                job: allData.job,
                marital_status: allData.marital_status,
                education: allData.education,
                latitude: parseFloat(allData.latitude),
                longitude: parseFloat(allData.longitude),
            };
            // Tambahkan file selfie baru jika diunggah
            if (req.file) {
                profileDataForUpdate.selfie_url = `/uploads/selfies/${req.file.filename}`;
            }
        } else if (role === 'mitra') {
            profileModel = prisma.mitraProfile;
             profileDataForUpdate = {
                pic_name: allData.pic_name,
                pic_phone: allData.pic_phone,
                pic_email: allData.pic_email,
                pic_status: allData.pic_status,
                owner_name: allData.owner_name,
                owner_phone: allData.owner_phone,
                owner_email: allData.owner_email,
                owner_ktp: allData.owner_ktp,
                owner_address_province: allData.owner_address_province,
                owner_address_city: allData.owner_address_city,
                owner_address_subdistrict: allData.owner_address_subdistrict,
                owner_address_village: allData.owner_address_village,
                owner_address_detail: allData.owner_address_detail,
                business_type: allData.business_type,
                business_entity: allData.business_entity,
                business_name: allData.business_name,
                business_address_province: allData.business_address_province,
                business_address_city: allData.business_address_city,
                business_address_subdistrict: allData.business_address_subdistrict,
                business_address_village: allData.business_address_village,
                business_address_detail: allData.business_address_detail,
                business_duration: allData.business_duration,
                social_media_platform: allData.social_media_platform,
                social_media_account: allData.social_media_account,
                latitude: parseFloat(allData.latitude),
                longitude: parseFloat(allData.longitude),
            };
        } else {
            return res.status(400).json({ message: 'Tipe user tidak valid untuk pendaftaran ulang.' });
        }
        
        if (req.file) {
            const existingProfile = await profileModel.findUnique({
                where: { user_id: userId },
                select: { selfie_url: true } // Asumsi Mitra juga punya selfie_url jika perlu
            });

            if (existingProfile && existingProfile.selfie_url) {
                const oldFilePath = path.join(__dirname, '..', 'public', existingProfile.selfie_url);
                try { await fs.unlink(oldFilePath); } catch (e) { console.error("Gagal hapus file lama:", e); }
            }
            // Tambahkan URL baru ke data yang akan diupdate
            profileDataForUpdate.selfie_url = `/uploads/selfies/${req.file.filename}`;
        }
        
        // 3. Jalankan transaksi dengan data yang sudah dipisah
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    ...userDataForUpdate,
                    status: 'pending',
                    resubmitted_at: new Date(),
                    rejection_reason: null, // Set kembali ke null
                },
            });
            await profileModel.update({
                where: { user_id: userId },
                data: profileDataForUpdate,
            });
        });

        res.status(200).json({ message: 'Data berhasil dikirim ulang dan akan ditinjau kembali oleh admin.' });
    } catch (error) {
        // Hapus file jika ada error database
        if (req.file) {
            try {
                await require('fs').promises.unlink(req.file.path);
            } catch (unlinkError) {
                console.error("Error deleting file after failed resubmit:", unlinkError);
            }
        }
        console.error('Resubmit Profile error:', error);
        res.status(500).json({ message: 'Gagal mengirim ulang data.' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Cari user (tetap sama, ini sudah baik)
        const user = await prisma.user.findUnique({ where: { email } });

        // 2. Validasi dasar (tetap sama)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email atau password salah.' });
        }

        // 3. Buat token terlebih dahulu, berdasarkan status
        let tokenScope = 'full'; // Default scope
        if (user.status === 'rejected' && user.resubmit_allowed) {
            tokenScope = 'resubmit';
        } else if (user.status === 'pending') {
            tokenScope = 'limited'; // Contoh scope baru untuk user pending
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, status: user.status, scope: tokenScope },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4. Buat respons yang akan dikirim, termasuk token
        const responsePayload = {
            message: 'Otentikasi berhasil.', // Pesan lebih netral
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                rejection_reason: user.rejection_reason,
                resubmit_allowed: user.resubmit_allowed
            }
        };
        
        // 5. Selalu kembalikan status 200 OK jika kredensial benar
        // Biarkan frontend yang memutuskan apa yang harus dilakukan berdasarkan 'status'
        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            message: 'Terjadi kesalahan saat login.',
        });
    }
};

exports.verifyEmail = async (req, res) => {
    const { token } = req.query; // Ambil token dari URL query (?token=...)

    if (!token) {
        return res.status(400).json({ message: "Token tidak ditemukan." });
    }

    try {
        // Cari token di DB yang belum kedaluwarsa
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token: token,
                expires_at: {
                    gt: new Date(), // 'gt' = greater than (lebih besar dari sekarang)
                },
            },
        });

        if (!verificationToken) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
        }

        // Jika token valid, update user dan hapus token
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: verificationToken.user_id },
                data: { is_verified: true}, 
            });
            await tx.verificationToken.delete({
                where: { id: verificationToken.id },
            });
        });

        res.status(200).json({ message: "Email berhasil diverifikasi! Anda selangkah lebih dekat agar data diverifikasi admin" });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat verifikasi email." });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // PENTING: Jangan beri tahu jika user tidak ditemukan untuk alasan keamanan
        // Cukup kirim respons sukses yang sama.
        if (user) {
            const token = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

            await prisma.verificationToken.create({
                data: {
                    token: token,
                    type: 'PASSWORD_RESET', // Gunakan tipe yang sudah kita siapkan
                    expires_at: expiresAt,
                    user_id: user.id,
                }
            });

            await sendPasswordResetEmail(user.email, token);
        }

        res.status(200).json({ message: "Jika email Anda terdaftar, link untuk mereset password telah dikirim." });
    } catch (error) {
        console.error("Forgot password error:", error);
        // Kirim respons generik bahkan jika terjadi error
        res.status(200).json({ message: "Jika email Anda terdaftar, link untuk mereset password telah dikirim." });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Token dan password baru dibutuhkan." });
    }

    try {
        // 1. Cari token yang valid dan sesuai tipenya
        const resetToken = await prisma.verificationToken.findFirst({
            where: {
                token: token,
                type: 'PASSWORD_RESET',
                expires_at: { gt: new Date() }
            }
        });

        if (!resetToken) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
        }

        // 2. Hash password baru
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update password user dan hapus token dalam satu transaksi
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: resetToken.user_id },
                data: { password: hashedPassword }
            });
            await tx.verificationToken.delete({
                where: { id: resetToken.id }
            });
        });

        res.status(200).json({ message: "Password berhasil diperbarui. Silakan login." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Gagal mereset password." });
    }
};