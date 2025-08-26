const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail, sendNewRegistrationNotification } = require('../utils/mailer');
const { geocodeAddressFlexible } = require('../utils/geocode/flexibleGeocode')

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
        owner_address_province_code, owner_address_province_name,
        owner_address_regency_code, owner_address_regency_name,
        owner_address_district_code, owner_address_district_name,
        owner_address_village_code, owner_address_village_name,
        owner_address_postal_code, owner_address_detail,
        business_type, business_entity, business_name,
        business_address_province_code, business_address_province_name,
        business_address_regency_code, business_address_regency_name,
        business_address_district_code, business_address_district_name,
        business_address_village_code, business_address_village_name,
        business_address_postal_code, business_address_detail,
        business_duration, social_media_platform, social_media_account, 
    } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Gambar selfie wajib diunggah.' });
    }

    const store_images = `/uploads/stores/${req.file.filename}`;

    try {

        const coordinates = await geocodeAddressFlexible({
        address_detail:         business_address_detail,
        address_village_name:   business_address_village_name,
        address_district_name:  business_address_district_name,
        address_regency_name:   business_address_regency_name,
        address_province_name:  business_address_province_name,
        address_postal_code:    business_address_postal_code,
        })
        // Hash password sebelum disimpan
        const hashedPassword = await bcrypt.hash(password, 10);

        const referrerId = await validateReferral(referral_code);
        // Gunakan nested write untuk membuat User dan MitraProfile sekaligus (transaksional)
        let verificationToken;

        const newUser = await prisma.$transaction(async (tx) => {
            // 1. Buat User dan Profil di dalam transaksi
            const createdUser = await tx.user.create({
                data: {
                    name: owner_name,
                    email: owner_email,
                    password: hashedPassword,
                    phone: owner_phone,
                    role: 'mitra',
                    status: 'pending',
                    mitraProfile: {
                        create: {
                            pic_name, pic_phone, pic_email, pic_status,
                            owner_name, owner_phone, owner_email, owner_ktp,
                            owner_address_province_code, owner_address_province_name,
                            owner_address_regency_code, owner_address_regency_name,
                            owner_address_district_code, owner_address_district_name,
                            owner_address_village_code, owner_address_village_name,
                            owner_address_postal_code, owner_address_detail,
                            business_type, business_entity, business_name,
                            business_address_province_code, business_address_province_name,
                            business_address_regency_code, business_address_regency_name,
                            business_address_district_code, business_address_district_name,
                            business_address_village_code, business_address_village_name,
                            business_address_postal_code, business_address_detail,
                            business_duration, social_media_platform, social_media_account,
                            latitude: coordinates?.latitude ?? null,
                            longitude: coordinates?.longitude ?? null,
                            store_images: store_images // Simpan sebagai array
                        },
                    },
                },
                select: { id: true, email: true, role: true, status: true, name: true }
            });

            // 2. Buat entri Referral di dalam transaksi yang sama
            if (referrerId) {
                // PERBAIKAN: Gunakan key dan tipe yang benar untuk Mitra
                const rewardPoint = await getSettingValue('referral_reward_mitra');
                await tx.referral.create({
                    data: {
                        referrer_id: referrerId,
                        referred_id: createdUser.id,
                        type: 'mitra', // <-- Diperbaiki dari 'co'
                        reward_point: rewardPoint,
                    }
                });
            }

            // 3. Buat token verifikasi di dalam transaksi yang sama
            verificationToken = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await tx.verificationToken.create({
                data: {
                    token: verificationToken,
                    type: 'EMAIL_VERIFICATION',
                    expires_at: expiresAt,
                    user_id: createdUser.id,
                }
            });

            return createdUser; // Kembalikan user yang baru dibuat dari transaksi
        });

        await sendVerificationEmail(newUser.email, verificationToken);
        sendNewRegistrationNotification(newUser);

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
        referral_code,
        address_province_code, address_province_name,
        address_regency_code, address_regency_name,
        address_district_code, address_district_name,
        address_village_code, address_village_name,
        address_postal_code, address_detail,
        job, marital_status, education,
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

         const coordinates = await geocodeAddressFlexible({
            address_detail,
            address_village_name,
            address_district_name,
            address_regency_name,
            address_province_name,
            address_postal_code,
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        const referrerId = await validateReferral(referral_code);

        const newUser = await prisma.$transaction(async (tx) => {
            // 1. Buat User dan Profil di dalam transaksi
            const createdUser = await tx.user.create({
                data: {
                    name, email, password: hashedPassword, phone,
                    role: 'co', status: 'pending',
                    coProfile: {
                        create: {
                            name, email, nik, birth_place,
                            birth_date: birthDateObject,
                            gender,  address_province_code, address_province_name,
                            address_regency_code, address_regency_name,
                            address_district_code, address_district_name,
                            address_village_code, address_village_name,
                            address_postal_code, address_detail,
                            job, marital_status, education, selfie_url,
                            latitude: coordinates?.latitude ?? null,
                            longitude: coordinates?.longitude ?? null,
                        },
                    },
                },
                select: { id: true, email: true, status: true, name: true, role: true } // Ambil data untuk notifikasi
            });

            // 2. Buat entri Referral di dalam transaksi yang sama
            if (referrerId) {
                const rewardPoint = await getSettingValue('referral_reward_co');
                await tx.referral.create({
                    data: {
                        referrer_id: referrerId,
                        referred_id: createdUser.id,
                        type: 'co',
                        reward_point: rewardPoint,
                    }
                });
            }

            // 3. Buat token verifikasi di dalam transaksi yang sama
            const verificationToken = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await tx.verificationToken.create({
                data: {
                    token: verificationToken,
                    type: 'EMAIL_VERIFICATION',
                    expires_at: expiresAt,
                    user_id: createdUser.id,
                }
            });

            // Kirim email setelah transaksi (di luar, tapi setelah data user didapat)
            await sendVerificationEmail(createdUser.email, verificationToken);
            sendNewRegistrationNotification(createdUser);

            return createdUser; // Kembalikan user yang baru dibuat
        });

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

        res.status(500).json({ message: `Terjadi kesalahan pada server saat registrasi. ${error.message} ` });
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

function buildGeocodePayloadFromAllData(role, allData) {
  if (role === 'co') {
    return {
      address_detail:        allData.address_detail,
      address_village_name:  allData.address_village_name,
      address_district_name: allData.address_district_name,
      address_regency_name:  allData.address_regency_name,
      address_province_name: allData.address_province_name,
      address_postal_code:   allData.address_postal_code,
    };
  }
  // mitra (alamat usaha)
  return {
    address_detail:        allData.business_address_detail,
    address_village_name:  allData.business_address_village_name,
    address_district_name: allData.business_address_district_name,
    address_regency_name:  allData.business_address_regency_name,
    address_province_name: allData.business_address_province_name,
    address_postal_code:   allData.business_address_postal_code,
  };
}

function hasAddressChanged(oldObj, newObj) {
  // bandingkan field utama alamat
  const keys = [
    'address_detail',
    'address_village_name',
    'address_district_name',
    'address_regency_name',
    'address_province_name',
    'address_postal_code',
  ];
  return keys.some(k => String(oldObj?.[k] ?? '') !== String(newObj?.[k] ?? ''));
}

exports.resubmitProfile = async (req, res) => {
    const { id: userId, role } = req.user;
    const allData = req.body;

    // Ambil file dari req.files (hasil dari upload.any())
    const newFile = (req.files && req.files.length > 0) ? req.files[0] : null;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== 'rejected' || !user.resubmit_allowed) {
            return res.status(403).json({ message: 'Anda tidak diizinkan untuk melakukan pendaftaran ulang.' });
        }

         const existingProfile =
            role === 'co'
                ? await prisma.coProfile.findUnique({ where: { user_id: userId } })
                : await prisma.mitraProfile.findUnique({ where: { user_id: userId } });

        // 1. Siapkan data untuk tabel User, ambil dari field yang sesuai dengan rolenya
        const userDataForUpdate = {
            name: role === 'co' ? allData.name : allData.owner_name,
            email: role === 'co' ? allData.email : allData.owner_email,
            phone: role === 'co' ? allData.phone : allData.owner_phone,
        };

        let profileDataForUpdate = {};
        let profileModel;

        if (role === 'co') {
            profileModel = prisma.coProfile;
            profileDataForUpdate = {
                name: allData.name, email: allData.email, nik: allData.nik,
                birth_place: allData.birth_place, birth_date: new Date(allData.birth_date),
                gender: allData.gender, address_province: allData.address_province,
                address_province_code: allData.address_province_code, 
                address_province_name: allData.address_province_name,
                address_regency_code: allData.address_regency_code, 
                address_regency_name: allData.address_regency_name,
                address_district_code: allData.address_district_code, 
                address_district_name: allData.address_district_name,
                address_village_code: allData.address_village_code, 
                address_village_name: allData.address_village_name,
                address_postal_code: allData.address_postal_code, 
                address_detail: allData.address_detail,
                job: allData.job, marital_status: allData.marital_status, education: allData.education,
                latitude: isFinite(parseFloat(allData.latitude))  ? parseFloat(allData.latitude)  : existingProfile?.latitude ?? null,
                longitude: isFinite(parseFloat(allData.longitude)) ? parseFloat(allData.longitude) : existingProfile?.longitude ?? null,
            };

            if (newFile) {
                const existingProfile = await prisma.coProfile.findUnique({ where: { user_id: userId }, select: { selfie_url: true } });
                if (existingProfile?.selfie_url) {
                    const relativePath = existingProfile.selfie_url.replace(/^[/\\]/, '');
                    const oldFilePath = path.join(__dirname, '..', 'public', relativePath);
                    try {
                        await fs.unlink(oldFilePath);
                        console.log(`File lama CO ${oldFilePath} berhasil dihapus.`);
                    } catch (e) {
                        console.error("Gagal hapus file lama CO:", e.message);
                    }
                }
                profileDataForUpdate.selfie_url = `/uploads/selfies/${newFile.filename}`;
            }

        } else if (role === 'mitra') {
            profileModel = prisma.mitraProfile;
            const businessTypeMap = { 'Jual Beli Kendaraan': 'jual_beli_kendaraan', 'Jasa Bengkel': 'bengkel', 'Jasa Cuci Kendaraan': 'cuci_kendaraan', 'Jual Beli Sparepart': 'jual_beli_sparepart', 'Jasa Sewa Kendaraan': 'sewa_kendaraan', 'Insurance Consultant': 'insurance_consultant', 'Fasilitas Pembiayaan': 'pembiayaan', 'Biro Jasa dan Sekolah Mengemudi': 'biro_jasa' };
            const businessTypeForDB = businessTypeMap[allData.business_type];

            profileDataForUpdate = {
                pic_name: allData.pic_name, pic_phone: allData.pic_phone, pic_email: allData.pic_email,
                pic_status: allData.pic_status, owner_name: allData.owner_name,
                owner_phone: allData.owner_phone, owner_email: allData.owner_email, owner_ktp: allData.owner_ktp,
                owner_address_province_code: allData.owner_address_province_code,
                owner_address_province_name: allData.owner_address_province_name,
                owner_address_regency_code: allData.owner_address_regency_code,
                owner_address_regency_name: allData.owner_address_regency_name,
                owner_address_district_code: allData.owner_address_district_code,
                owner_address_district_name: allData.owner_address_district_name,
                owner_address_village_code: allData.owner_address_village_code,
                owner_address_village_name: allData.owner_address_village_name,
                owner_address_postal_code: allData.owner_address_postal_code,
                owner_address_detail: allData.owner_address_detail, business_type: businessTypeForDB,
                business_entity: allData.business_entity, business_name: allData.business_name,
                business_address_province_code: allData.business_address_province_code,
                business_address_province_name: allData.business_address_province_name,
                business_address_regency_code: allData.business_address_regency_code,
                business_address_regency_name: allData.business_address_regency_name,
                business_address_district_code: allData.business_address_district_code,
                business_address_district_name: allData.business_address_district_name,
                business_address_village_code: allData.business_address_village_code,
                business_address_village_name: allData.business_address_village_name,
                business_address_postal_code: allData.business_address_postal_code,
                business_address_detail: allData.business_address_detail, business_duration: allData.business_duration,
                social_media_platform: allData.social_media_platform, social_media_account: allData.social_media_account,
                latitude: isFinite(parseFloat(allData.latitude))  ? parseFloat(allData.latitude)  : existingProfile?.latitude ?? null,
                longitude: isFinite(parseFloat(allData.longitude)) ? parseFloat(allData.longitude) : existingProfile?.longitude ?? null,
            };

            if (newFile) {
                const existingProfile = await prisma.mitraProfile.findUnique({ where: { user_id: userId }, select: { store_images: true } });
                if (existingProfile?.store_images) {
                    const relativePath = existingProfile.store_images.replace(/^[/\\]/, '');
                    const oldFilePath = path.join(__dirname, '..', 'public', relativePath);
                    try {
                        await fs.unlink(oldFilePath);
                        console.log(`File lama Mitra ${oldFilePath} berhasil dihapus.`);
                    } catch (e) {
                        console.error("Gagal hapus file lama Mitra:", e.message);
                    }
                }
                profileDataForUpdate.store_images = `/uploads/stores/${newFile.filename}`;
            }
        } else {
            return res.status(400).json({ message: 'Tipe user tidak valid untuk pendaftaran ulang.' });
        }
         const newAddr = buildGeocodePayloadFromAllData(role, allData);
         const oldAddr =
          role === 'co'
            ? {
                address_detail:        existingProfile?.address_detail,
                address_village_name:  existingProfile?.address_village_name,
                address_district_name: existingProfile?.address_district_name,
                address_regency_name:  existingProfile?.address_regency_name,
                address_province_name: existingProfile?.address_province_name,
                address_postal_code:   existingProfile?.address_postal_code,
              }
            : {
                address_detail:        existingProfile?.business_address_detail,
                address_village_name:  existingProfile?.business_address_village_name,
                address_district_name: existingProfile?.business_address_district_name,
                address_regency_name:  existingProfile?.business_address_regency_name,
                address_province_name: existingProfile?.business_address_province_name,
                address_postal_code:   existingProfile?.business_address_postal_code,
              };
          
        const needGeocode =
          hasAddressChanged(oldAddr, newAddr) ||
          !isFinite(parseFloat(profileDataForUpdate.latitude)) ||
          !isFinite(parseFloat(profileDataForUpdate.longitude));
          
        if (needGeocode) {
          try {
            const coords = await geocodeAddressFlexible(newAddr); // structured -> freeform fallback
            if (coords) {
              profileDataForUpdate.latitude  = coords.latitude;
              profileDataForUpdate.longitude = coords.longitude;
            }
          } catch (e) {
            console.warn('Resubmit geocode skipped (fallback to previous lat/lon):', e.message);
          }
        }

        // Jalankan transaksi
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    ...userDataForUpdate,
                    status: 'pending',
                    resubmitted_at: new Date(),
                    rejection_reason: null,
                },
            });
            await profileModel.update({
                where: { user_id: userId },
                data: profileDataForUpdate,
            });
        });

        res.status(200).json({ message: 'Data berhasil dikirim ulang dan akan ditinjau kembali oleh admin.' });
    } catch (error) {
        if (newFile) {
            try {
                await fs.unlink(newFile.path);
                console.log(`File baru ${newFile.filename} dihapus karena resubmit gagal.`);
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
                data: { email_is_verified: true },
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