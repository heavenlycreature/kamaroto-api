const { PrismaClient } = require('@prisma/client');
const { geocodeAddressFlexible } = require('../utils/geocode/flexibleGeocode');
const prisma = new PrismaClient();

exports.getMitraProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: 'mitra'
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        email_is_verified: true, // Ambil status verifikasi email
        mitraProfile: true
      }
    });

    if (!user || !user.mitraProfile) {
      return res.status(404).json({ message: 'Profil Mitra tidak ditemukan.' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('Error fetching mitra profile:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.updateMitraProfile = async (req, res) => {
   const userId = req.user.id;

    const {
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
        business_duration, social_media_platform, social_media_account
    } = req.body;

    try {
        const current = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                mitraProfile: {
                    select: {
                        business_address_province_name: true, business_address_regency_name: true,
                        business_address_district_name: true, business_address_village_name: true,
                        business_address_postal_code: true, business_address_detail: true,
                        latitude: true, longitude: true
                    }
                }
            }
        });

        const mitraUpdateData = {};

        const fieldsToUpdate = {
            pic_name, pic_phone, pic_email, pic_status, owner_name, owner_phone, owner_email, owner_ktp,
            owner_address_province_code, owner_address_province_name, owner_address_regency_code, owner_address_regency_name,
            owner_address_district_code, owner_address_district_name, owner_address_village_code, owner_address_village_name,
            owner_address_postal_code, owner_address_detail, business_type, business_entity, business_name,
            business_address_province_code, business_address_province_name, business_address_regency_code, business_address_regency_name,
            business_address_district_code, business_address_district_name, business_address_village_code, business_address_village_name,
            business_address_postal_code, business_address_detail, business_duration, social_media_platform, social_media_account
        };

        Object.entries(fieldsToUpdate).forEach(([key, value]) => {
            if (value !== undefined) {
                mitraUpdateData[key] = value;
            }
        });

        // [LOGIKA BARU] Deteksi perubahan alamat bisnis (seperti pada Captain)
        const before = current?.mitraProfile || {};
        const addressChanged =
            (business_address_province_name && business_address_province_name !== before.business_address_province_name) ||
            (business_address_regency_name  && business_address_regency_name  !== before.business_address_regency_name)  ||
            (business_address_district_name && business_address_district_name !== before.business_address_district_name) ||
            (business_address_village_name  && business_address_village_name  !== before.business_address_village_name)  ||
            (business_address_postal_code   && business_address_postal_code   !== before.business_address_postal_code)   ||
            (business_address_detail !== undefined && business_address_detail !== before.business_address_detail);

        if (addressChanged) {
            const structured = {
                street:     business_address_detail         || before.business_address_detail || '',
                city:       business_address_regency_name   || before.business_address_regency_name || '',
                state:      business_address_province_name  || before.business_address_province_name || '',
                postalcode: business_address_postal_code    || before.business_address_postal_code || '',
            };
            if (!structured.city) structured.city = business_address_district_name || before.business_address_district_name || '';

            // Asumsi Anda punya fungsi geocodeAddressFlexible yang sama
            const coords = await geocodeAddressFlexible({ structured });
            mitraUpdateData.latitude  = coords?.latitude  ?? null;
            mitraUpdateData.longitude = coords?.longitude ?? null;
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                mitraProfile: { update: mitraUpdateData }
            },
            select: { id: true, email: true, phone: true, mitraProfile: true }
        });

        res.status(200).json({ message: 'Profil mitra berhasil diperbarui.', user: updated });

    } catch (error) {
        console.error('Error updating mitra profile:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

