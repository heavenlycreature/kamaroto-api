const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { geocodeAddressFlexible } = require('../utils/geocode/flexibleGeocode');

/**
 * Mengambil detail profil dari Captain yang sedang login.
 */
exports.getCaptainProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: { 
                id: userId,
                role: 'co'
            },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                coProfile: true
            }
        });

        if (!user || !user.coProfile) {
            return res.status(404).json({ message: 'Profil Captain tidak ditemukan.' });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error('Error fetching captain profile:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

/**
 * Memperbarui detail profil dari Captain yang sedang login.
 * Jika alamat diubah, fungsi ini akan secara otomatis mencari dan memperbarui koordinat.
 */
exports.updateCaptainProfile = async (req, res) => {
    const userId = req.user.id;
    
    const {
    name, phone, birth_date, gender, job, marital_status, education,
    address_detail,
    address_province_code, address_province_name,
    address_regency_code, address_regency_name,
    address_district_code, address_district_name,
    address_village_code, address_village_name,
    address_postal_code,
  } = req.body;

     try {
    // ambil profil lama untuk deteksi perubahan alamat
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        coProfile: {
          select: {
            address_province_name: true, address_regency_name: true,
            address_district_name: true, address_village_name: true,
            address_postal_code: true, address_detail: true,
            latitude: true, longitude: true
          }
        }
      }
    });

    const coProfileUpdateData = {};
    const userUpdateData = {};

    if (name) userUpdateData.name = name;
    if (phone) userUpdateData.phone = phone;

    if (birth_date) coProfileUpdateData.birth_date = new Date(birth_date);
    if (gender) coProfileUpdateData.gender = gender;
    if (job) coProfileUpdateData.job = job;
    if (marital_status) coProfileUpdateData.marital_status = marital_status;
    if (education) coProfileUpdateData.education = education;
    if (address_detail !== undefined) coProfileUpdateData.address_detail = address_detail;

    // alamat (schema baru) — simpan apa adanya jika dikirim
    const addressFields = {
      address_province_code, address_province_name,
      address_regency_code,  address_regency_name,
      address_district_code, address_district_name,
      address_village_code,  address_village_name,
      address_postal_code
    };
    Object.entries(addressFields).forEach(([k, v]) => {
      if (v !== undefined) coProfileUpdateData[k] = v;
    });

    // ==== DETEKSI: apakah alamat berubah? ====
    const before = current?.coProfile || {};
    const changed =
      (address_province_name && address_province_name !== before.address_province_name) ||
      (address_regency_name  && address_regency_name  !== before.address_regency_name)  ||
      (address_district_name && address_district_name !== before.address_district_name) ||
      (address_village_name  && address_village_name  !== before.address_village_name)  ||
      (address_postal_code   && address_postal_code   !== before.address_postal_code)   ||
      (address_detail !== undefined && address_detail !== before.address_detail);

    // ==== GEOCODE bila ada perubahan alamat ====
    if (changed) {
      // rakit query terstruktur untuk Nominatim
      const structured = {
        street:  address_detail || before.address_detail || '',
        city:    address_regency_name  || before.address_regency_name  || '',
        county:  '', // opsional, kita tidak punya
        state:   address_province_name || before.address_province_name || '',
        postalcode: address_postal_code || before.address_postal_code || '',
      };
      // beberapa wilayah pakai "district" sebagai kota — fallback bila city kosong
      if (!structured.city) structured.city = address_district_name || before.address_district_name || '';

      const coords = await geocodeAddressFlexible({ structured });
      coProfileUpdateData.latitude  = coords?.latitude  ?? null;
      coProfileUpdateData.longitude = coords?.longitude ?? null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdateData,
        coProfile: { update: coProfileUpdateData }
      },
      select: { id: true, email: true, phone: true, coProfile: true }
    });

    res.status(200).json({ message: 'Profil berhasil diperbarui.', user: updated });
  } catch (error) {
    console.error('Error updating captain profile:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui profil.' });
  }
};

/**
 * Mengambil daftar pengguna (CO & Mitra) yang berhasil direferensikan
 * oleh CO yang sedang login.
 */
exports.getReferredUsers = async (req, res) => {
    // Ambil ID CO yang sedang login dari token JWT
    const referrerId = req.user.id;

    try {
        // Cari semua entri di tabel Referral di mana CO ini adalah 'referrer'
        const referrals = await prisma.referral.findMany({
            where: {
                referrer_id: referrerId,
            },
            // Sertakan data lengkap dari pengguna yang direferensikan ('referred')
            include: {
                referred: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                        email_is_verified: true, // Ambil status verifikasi email
                        created_at: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc' // Tampilkan yang terbaru di atas
            }
        });

        // Format data agar lebih mudah dibaca oleh frontend
        const referredUsers = referrals.map(referral => ({
            ...referral.referred, // Ambil semua data user yang direferensikan
            referral_date: referral.created_at,
            reward_point: referral.reward_point,
            reward_status: referral.rewarded ? 'Diberikan' : 'Menunggu Persetujuan'
        }));

        res.status(200).json({
            message: "Data referral berhasil diambil.",
            data: referredUsers
        });

    } catch (error) {
        console.error("Error fetching referred users:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

/**
 * Mengambil statistik ringkas untuk CO yang sedang login.
 * Contoh: Total Poin, Total Referral Sukses.
 */
exports.getReferralStats = async (req, res) => {
    const referrerId = req.user.id;
    try {
        // Hitung total poin dari tabel Point
        const totalPoints = await prisma.point.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                user_id: referrerId,
                // Anda bisa filter berdasarkan tipe jika perlu, misal: type: 'referral'
            },
        });

        // Hitung total referral yang berhasil (sudah di-approve dan diberi reward)
        const successfulReferrals = await prisma.referral.count({
            where: {
                referrer_id: referrerId,
                rewarded: true,
            },
        });

        res.status(200).json({
            message: "Statistik referral berhasil diambil.",
            data: {
                total_points: totalPoints._sum.amount || 0,
                successful_referrals: successfulReferrals,
            }
        });

    } catch (error) {
        console.error("Error fetching referral stats:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
