const { Prisma, PrismaClient } = require('@prisma/client'); // Sesuaikan path ke prisma client Anda
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.updateStoreInfo = (mitraProfileId, data) => {
    // Ambil hanya field yang boleh diubah oleh mitra
    const { business_name, business_logo_url, business_banner_url, openHours } = data;

    const dataToUpdate = {
        business_name,
        business_logo_url,
        business_banner_url,
        openHours,
    };

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

/**
 * Membuat produk baru (Kendaraan atau Sparepart).
 * Jika tipenya VEHICLE, data detailnya juga akan dibuat dalam satu transaksi.
 * @param {string} storeId - ID toko milik Mitra.
 * @param {object} data - Data produk dari request body.
 * @returns {Promise<object>} - Objek produk yang baru dibuat.
 */
exports.createProduct = async (mitraProfileId, data) => {
    const { type, vehicleDetail, ...productData } = data;

    // Validasi input
    if (!type || !['VEHICLE', 'SPAREPART'].includes(type)) {
        throw new Error('Tipe produk tidak valid. Harus VEHICLE atau SPAREPART.');
    }

    if (productData.price) {
        productData.price = parseFloat(productData.price);
    }
    if (productData.stock) {
        productData.stock = parseInt(productData.stock, 10);
    }
    
    // Gunakan transaksi Prisma untuk memastikan integritas data
    const newProduct = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
            data: {
                ...productData,
                type: type,
                mitraProfileId: mitraProfileId,
            }
        });

        // Jika produk adalah kendaraan, buat juga entri di tabel VehicleDetail
        if (type === 'VEHICLE') {
            await tx.vehicleDetail.create({
                data: {
                    ...vehicleDetail,
                    productId: product.id, // Hubungkan dengan produk yang baru dibuat
                }
            });
        }

        if (files.length > 0) {
            const mediaData = files.map((file, index) => ({
                // Simpan path relatif yang bisa diakses publik
                url: `/uploads/products/${file.filename}`,
                type: 'IMAGE',
                order: index, // Urutan berdasarkan urutan upload
                productId: product.id
            }));
            await tx.productMedia.createMany({ data: mediaData });
        }

        return product;
    });

    // Ambil kembali data lengkap untuk dikirim sebagai response
    return prisma.product.findUnique({
        where: { id: newProduct.id },
        include: {
            vehicleDetail: true,
            media: {
                orderBy: { order: 'asc' } // Urutkan gambar berdasarkan 'order'
            }
        }
    });
};

/**
 * Mengambil semua produk dari sebuah toko.
 * @param {string} mitraProfileId - ID toko.
 * @returns {Promise<Array>} - Daftar produk.
 */
exports.getProductsByStore = (mitraProfileId) => {
    return prisma.product.findMany({
        where: { mitraProfileId },
        orderBy: { createdAt: 'desc' },
        include: { vehicleDetail: true } // Selalu sertakan detail kendaraan jika ada
    });
};

/**
 * Mengambil satu produk berdasarkan ID.
 * @param {string} id - ID produk.
 * @returns {Promise<object>} - Objek produk.
 */
exports.getProductById = (id) => {
    return prisma.product.findUniqueOrThrow({
        where: { id },
        include: { vehicleDetail: true }
    });
};

/**
 * Memperbarui produk.
 * Jika tipenya VEHICLE, detailnya juga akan diperbarui.
 * @param {string} id - ID produk yang akan diupdate.
 * @param {object} data - Data baru untuk produk dari req.body.
 * @param {Array} files - File-file baru yang diunggah dari req.files.
 * @returns {Promise<object>} - Objek produk yang sudah diperbarui.
 */
exports.updateProduct = async (id, data, files = []) => {
    const { vehicleDetail, existingMediaUrls, ...productData } = data;
    const keptUrls = existingMediaUrls ? JSON.parse(existingMediaUrls) : [];

    const oldMedia = await prisma.productMedia.findMany({
        where: { productId: id },
    });

    const urlsToDelete = oldMedia
        .filter(media => !keptUrls.includes(media.url))
        .map(media => media.url);

    // Langkah 3: Hapus setiap file fisik dari storage
    if (urlsToDelete.length > 0) {
        console.log('File yang akan dihapus dari storage:', urlsToDelete);
        urlsToDelete.forEach(url => {
            try {
                // Buat path absolut ke file. Contoh url: '/uploads/products/file.jpg'
                const filePath = path.join(process.cwd(), 'public', url);

                // Cek apakah file ada sebelum dihapus
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Hapus file secara sinkron
                    console.log(`File berhasil dihapus: ${filePath}`);
                } else {
                    console.warn(`File tidak ditemukan, tidak jadi dihapus: ${filePath}`);
                }
            } catch (err) {
                console.error(`Gagal menghapus file ${url}:`, err);
            }
        });
    }


    return prisma.$transaction(async (tx) => {
        await tx.product.update({
            where: { id },
            data: {
                ...productData,
                vehicleDetail: vehicleDetail ? { update: vehicleDetail } : undefined,
            },
        });

        await tx.productMedia.deleteMany({
            where: { productId: id }
        });

        if (finalOrder.length > 0) {
            const mediaToCreate = [];
            let newFileIndex = 0;

            finalOrder.forEach((item, index) => {
                if (item.startsWith('NEW_FILE_')) {
                    // Ini adalah file baru dari `req.files`
                    const file = files[newFileIndex];
                    if (file) {
                        mediaToCreate.push({
                            url: `/uploads/products/${file.filename}`,
                            type: 'IMAGE',
                            order: index,
                            productId: id
                        });
                        newFileIndex++;
                    }
                } else {
                    // Ini adalah URL lama yang dipertahankan
                    mediaToCreate.push({
                        url: item,
                        type: 'IMAGE',
                        order: index,
                        productId: id
                    });
                }
            });

            if (mediaToCreate.length > 0) {
                await tx.productMedia.createMany({ data: mediaToCreate });
            }
        }

        return tx.product.findUniqueOrThrow({
            where: { id },
            include: {
                vehicleDetail: true,
                media: { orderBy: { order: 'asc' } }
            }
        });
    });
};

/**
 * Menghapus produk.
 * Karena ada `onDelete: Cascade` di skema, detail terkait akan ikut terhapus.
 * @param {string} id - ID produk yang akan dihapus.
 * @returns {Promise<void>}
 */
exports.deleteProduct = async (id) => {
    const mediaToDelete = await prisma.productMedia.findMany({
        where: { productId: id },
        select: { url: true }
    });

    await prisma.product.delete({
        where: { id }
    });

    if (mediaToDelete.length > 0) {
        console.log('Menghapus file fisik dari storage:', mediaToDelete.map(m => m.url));
        mediaToDelete.forEach(media => {
            try {
                const filePath = path.join(process.cwd(), 'public', media.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`File berhasil dihapus: ${filePath}`);
                }
            } catch (err) {
                console.error(`Gagal menghapus file fisik ${media.url}:`, err);
            }
        });
    }

    return;
}