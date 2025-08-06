const { PrismaClient } = require('@prisma/client');
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
    owner_address_province, owner_address_city, owner_address_subdistrict, owner_address_village, owner_address_detail,
    business_type, business_entity, business_name,
    business_address_province, business_address_city, business_address_subdistrict, business_address_village, business_address_detail,
    business_duration, social_media_platform, social_media_account
  } = req.body;

  try {
    const mitraUpdateData = {};

    // Info PIC
    if (pic_name) mitraUpdateData.pic_name = pic_name;
    if (pic_phone) mitraUpdateData.pic_phone = pic_phone;
    if (pic_email) mitraUpdateData.pic_email = pic_email;
    if (pic_status) mitraUpdateData.pic_status = pic_status;

    // Info Pemilik
    if (owner_name) mitraUpdateData.owner_name = owner_name;
    if (owner_phone) mitraUpdateData.owner_phone = owner_phone;
    if (owner_email) mitraUpdateData.owner_email = owner_email;
    if (owner_ktp) mitraUpdateData.owner_ktp = owner_ktp;
    if (owner_address_province) mitraUpdateData.owner_address_province = owner_address_province;
    if (owner_address_city) mitraUpdateData.owner_address_city = owner_address_city;
    if (owner_address_subdistrict) mitraUpdateData.owner_address_subdistrict = owner_address_subdistrict;
    if (owner_address_village) mitraUpdateData.owner_address_village = owner_address_village;
    if (owner_address_detail) mitraUpdateData.owner_address_detail = owner_address_detail;

    // Info Bisnis
    if (business_type) mitraUpdateData.business_type = business_type;
    if (business_entity) mitraUpdateData.business_entity = business_entity;
    if (business_name) mitraUpdateData.business_name = business_name;
    if (business_address_province) mitraUpdateData.business_address_province = business_address_province;
    if (business_address_city) mitraUpdateData.business_address_city = business_address_city;
    if (business_address_subdistrict) mitraUpdateData.business_address_subdistrict = business_address_subdistrict;
    if (business_address_village) mitraUpdateData.business_address_village = business_address_village;
    if (business_address_detail) mitraUpdateData.business_address_detail = business_address_detail;
    if (business_duration) mitraUpdateData.business_duration = business_duration;
    if (social_media_platform) mitraUpdateData.social_media_platform = social_media_platform;
    if (social_media_account) mitraUpdateData.social_media_account = social_media_account;

    // LOGIKA UPDATE KOORDINAT (berdasarkan alamat bisnis)
    if (business_address_province && business_address_city && business_address_subdistrict && business_address_village) {
      const location = await prisma.address.findFirst({
        where: {
          province: business_address_province,
          city: business_address_city,
          district: business_address_subdistrict,
          subdistrict: business_address_village
        }
      });

      mitraUpdateData.latitude = location?.latitude ?? null;
      mitraUpdateData.longitude = location?.longitude ?? null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        mitraProfile: {
          update: mitraUpdateData
        }
      },
      select: {
        id: true,
        email: true,
        phone: true,
        mitraProfile: true
      }
    });

    res.status(200).json({ message: 'Profil mitra berhasil diperbarui.', user: updated });

  } catch (error) {
    console.error('Error updating mitra profile:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

