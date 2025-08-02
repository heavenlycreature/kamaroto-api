const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        name, phone, birth_date, gender,
        address_province, address_city, address_subdistrict, address_village, address_detail,
        job, marital_status, education
    } = req.body;

    try {
        // Siapkan objek untuk menampung data yang akan diupdate di coProfile
        const coProfileUpdateData = {};

        // Tambahkan data non-alamat ke objek update jika ada
        if (name) coProfileUpdateData.name = name;
        if (birth_date) coProfileUpdateData.birth_date = new Date(birth_date);
        if (gender) coProfileUpdateData.gender = gender;
        if (job) coProfileUpdateData.job = job;
        if (marital_status) coProfileUpdateData.marital_status = marital_status;
        if (education) coProfileUpdateData.education = education;
        if (address_detail) coProfileUpdateData.address_detail = address_detail;

        // --- LOGIKA BARU UNTUK UPDATE KOORDINAT ---
        // Cek apakah semua field alamat yang diperlukan ada untuk mencari koordinat baru
        if (address_province && address_city && address_subdistrict && address_village) {
            // Tambahkan field alamat ke data yang akan diupdate
            coProfileUpdateData.address_province = address_province;
            coProfileUpdateData.address_city = address_city;
            coProfileUpdateData.address_subdistrict = address_subdistrict;
            coProfileUpdateData.address_village = address_village;

            // Cari data alamat di database untuk mendapatkan koordinat baru
            const newAddressData = await prisma.address.findFirst({
                where: {
                    province: address_province,
                    city: address_city,
                    district: address_subdistrict, // Sesuaikan dengan skema Anda
                    subdistrict: address_village,   // Sesuaikan dengan skema Anda
                }
            });

            // Jika alamat ditemukan, perbarui latitude dan longitude
            if (newAddressData) {
                coProfileUpdateData.latitude = newAddressData.latitude;
                coProfileUpdateData.longitude = newAddressData.longitude;
            } else {
                // Opsional: jika alamat baru tidak ada di DB, Anda bisa set koordinat ke null
                coProfileUpdateData.latitude = null;
                coProfileUpdateData.longitude = null;
            }
        }

        // Siapkan data untuk diupdate di tabel user
        const userUpdateData = {};
        if (name) userUpdateData.name = name;
        if (phone) userUpdateData.phone = phone;

        // Lakukan update secara transaksional
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...userUpdateData,
                coProfile: {
                    update: coProfileUpdateData
                }
            },
            select: {
                id: true,
                email: true,
                phone: true,
                coProfile: true
            }
        });

        res.status(200).json({ message: 'Profil berhasil diperbarui.', user: updatedUser });

    } catch (error) {
        console.error('Error updating captain profile:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui profil.' });
    }
};
