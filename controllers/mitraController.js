const { PrismaClient } = require('@prisma/client');
const { geocodeAddressFlexible } = require('../utils/geocode/flexibleGeocode');
const prisma = new PrismaClient();
const productService = require('../services/mitraService');


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


exports.updateStoreInfo = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const updateData = req.body;
         const files = req.files;

        if (updateData.openHours) {
            updateData.openHours = JSON.parse(updateData.openHours);
        }
        const updatedProfile = await mitraService.updateStoreInfo(mitraProfileId, updateData, files);
        res.status(200).json({ message: 'Informasi toko berhasil diperbarui.', data: updatedProfile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Membuat produk baru berdasarkan data dari body request.
 */
exports.createProduct = async (req, res) => {
    try {
        // ID toko diambil dari data user yang sudah diverifikasi oleh middleware auth
        const mitraProfileId = req.user.mitraProfile.id;
        const productData = req.body;
        const files = req.files; 
        
        if (productData.vehicleDetail) {
            productData.vehicleDetail = JSON.parse(productData.vehicleDetail);
        }


        const product = await productService.createProduct(mitraProfileId, productData, files);
        
        res.status(201).json({ message: 'Produk berhasil dibuat.', data: product });
    } catch (error) {
        // Tangani error validasi dari service
        res.status(400).json({ message: error.message });
    }
};

/**
 * Mengambil daftar produk untuk toko milik Mitra yang sedang login.
 */
exports.getMyProducts = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const products = await productService.getProductsByStore(mitraProfileId);
        res.status(200).json({ data: products });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data produk.', error: error.message });
    }
};

/**
 * Mengambil detail satu produk berdasarkan ID.
 */
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        res.status(200).json({ data: product });
    } catch (error) {
        // findUniqueOrThrow akan melempar error jika tidak ditemukan
        res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }
};

/**
 * Memperbarui data produk.
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const files = req.files; 
        
        if (productData.vehicleDetail) {
            productData.vehicleDetail = JSON.parse(productData.vehicleDetail);
        }

        const updatedProduct = await productService.updateProduct(id, updateData, files);
        res.status(200).json({ message: 'Produk berhasil diperbarui.', data: updatedProduct });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Menghapus produk.
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await productService.deleteProduct(id);
        // Status 204 No Content adalah standar untuk delete yang berhasil
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus produk.', error: error.message });
    }
};

