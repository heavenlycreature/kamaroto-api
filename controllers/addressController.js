// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// /**
//  * Mengambil daftar alamat unik (provinsi, kota, kecamatan, atau kelurahan)
//  * secara dinamis berdasarkan query yang diberikan.
//  */
// exports.getAddresses = async (req, res) => {
//     const { province, city, district } = req.query;

//     let where = {};
//     let select = {};
//     let orderBy = {};

//     // Logika untuk menentukan data apa yang harus diambil
//     if (province && city && district) {
//         // 4. Ambil Kelurahan
//         where = { province, city, district };
//         select = { subdistrict: true };
//         orderBy = { subdistrict: 'asc' };
//     } else if (province && city) {
//         // 3. Ambil Kecamatan
//         where = { province, city };
//         select = { district: true };
//         orderBy = { district: 'asc' };
//     } else if (province) {
//         // 2. Ambil Kota/Kabupaten
//         where = { province };
//         select = { city: true };
//         orderBy = { city: 'asc' };
//     } else {
//         // 1. Ambil Provinsi
//         select = { province: true };
//         orderBy = { province: 'asc' };
//     }

//     try {
//         const results = await prisma.address.findMany({
//             where: where,
//             select: select,
//             // Kunci perbaikan: `distinct` hanya pada field yang di-select
//             distinct: Object.keys(select),
//             orderBy: orderBy,
//         });

//         res.status(200).json(results);
//     } catch (error) {
//         res.status(500).json({ message: "Gagal mengambil data alamat", error: error.message });
//     }
// };

// /**
//  * Mengambil data koordinat (lat, long) untuk satu alamat spesifik.
//  * Endpoint ini dibutuhkan oleh useEffect terakhir di frontend.
//  */
// exports.getCoordinates = async (req, res) => {
//     const { province, city, district, subdistrict } = req.query;

//     // Validasi input
//     if (!province || !city || !district || !subdistrict) {
//         return res.status(400).json({ message: "Semua parameter alamat (province, city, district, subdistrict) dibutuhkan." });
//     }

//     try {
//         const address = await prisma.address.findFirst({
//             where: {
//                 province,
//                 city,
//                 district,
//                 subdistrict
//             }
//         });

//         if (!address) {
//             return res.status(404).json({ message: "Alamat tidak ditemukan." });
//         }

//         res.status(200).json({
//             latitude: address.latitude,
//             longitude: address.longitude,
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Gagal mengambil data koordinat", error: error.message });
//     }
// };