const { Prisma, PrismaClient } = require('@prisma/client'); // Sesuaikan path ke prisma client Anda
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.getMitraProfile = async (userId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: 'mitra' }, // findFirst, karena role bukan unique
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      email_is_verified: true,
      mitraProfile: true,
    },
  });

  if (!user || !user.mitraProfile) {
    const err = new Error('Profil Mitra tidak ditemukan.');
    err.status = 404;
    throw err;
  }

  return user;
};

exports.updateMitraProfile = async (userId, body, geocodeAddressFlexible) => {
  // Ambil alamat existing untuk deteksi perubahan
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mitraProfile: {
        select: {
          business_address_province_name: true,
          business_address_regency_name: true,
          business_address_district_name: true,
          business_address_village_name: true,
          business_address_postal_code: true,
          business_address_detail: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  const before = current?.mitraProfile || {};

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
    business_duration, social_media_platform, social_media_account,
  } = body;

  // Kumpulkan field yang di-define saja
  const fields = {
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
  };

  const updateData = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) updateData[k] = v;
  }

  // Deteksi perubahan alamat bisnis
  const addressChanged =
    (updateData.business_address_province_name && updateData.business_address_province_name !== before.business_address_province_name) ||
    (updateData.business_address_regency_name  && updateData.business_address_regency_name  !== before.business_address_regency_name)  ||
    (updateData.business_address_district_name && updateData.business_address_district_name !== before.business_address_district_name) ||
    (updateData.business_address_village_name  && updateData.business_address_village_name  !== before.business_address_village_name)  ||
    (updateData.business_address_postal_code   && updateData.business_address_postal_code   !== before.business_address_postal_code)   ||
    (Object.prototype.hasOwnProperty.call(updateData, 'business_address_detail') &&
      updateData.business_address_detail !== before.business_address_detail);

  if (addressChanged && typeof geocodeAddressFlexible === 'function') {
    const coords = await geocodeAddressFlexible({
      address_detail:        updateData.business_address_detail ?? before.business_address_detail ?? '',
      address_village_name:  updateData.business_address_village_name ?? before.business_address_village_name ?? '',
      address_district_name: updateData.business_address_district_name ?? before.business_address_district_name ?? '',
      address_regency_name:  updateData.business_address_regency_name ?? before.business_address_regency_name ?? '',
      address_province_name: updateData.business_address_province_name ?? before.business_address_province_name ?? '',
      address_postal_code:   updateData.business_address_postal_code ?? before.business_address_postal_code ?? '',
    });
    updateData.latitude  = coords?.latitude  ?? null;
    updateData.longitude = coords?.longitude ?? null;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { mitraProfile: { update: updateData } },
      select: { id: true, email: true, phone: true, mitraProfile: true },
    });
    return updated;
  } catch (e) {
    // Oper ke controller dengan info yang berguna
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // sertakan meta target untuk mapping di controller
      const err = new Error('Unique constraint failed');
      err.code = 'P2002';
      err.target = e.meta?.target;
      throw err;
    }
    throw e;
  }
};

exports.updateStoreInfo = async (mitraProfileId, data, files = {}) => {
    const currentProfile = await prisma.mitraProfile.findUnique({
        where: { id: mitraProfileId },
        select: { business_logo_url: true, business_banner_url: true }
    });

    if (!currentProfile) {
        throw new Error('Profil Mitra tidak ditemukan.');
    }

    const dataToUpdate = { ...data };

    const deleteOldFile = (filePath) => {
        if (!filePath) return;
        try {
            const fullPath = path.join(process.cwd(), 'public', filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`File lama dihapus: ${fullPath}`);
            }
        } catch (err) {
            console.error(`Gagal menghapus file lama ${filePath}:`, err);
        }
    };

    if (files.logo && files.logo[0]) {
        deleteOldFile(currentProfile.business_logo_url);
        dataToUpdate.business_logo_url = `/uploads/store-assets/${files.logo[0].filename}`;
    }

    if (files.banner && files.banner[0]) {
        deleteOldFile(currentProfile.business_banner_url);
        dataToUpdate.business_banner_url = `/uploads/store-assets/${files.banner[0].filename}`;
    }
    
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined) {
            delete dataToUpdate[key];
        }
    });
    
    return prisma.mitraProfile.update({
        where: { id: mitraProfileId },
        data: dataToUpdate
    });
};