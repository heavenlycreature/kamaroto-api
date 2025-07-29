const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch'); // Menggunakan node-fetch@2
require('dotenv').config(); // Memuat variabel dari file .env

const prisma = new PrismaClient();

// **LANGKAH 1: Dapatkan API Key dari environment variable**
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

// **LANGKAH 2: Struktur data dirombak untuk menyertakan provinsi**
const JABODETABEK_AREAS = [
    { province: 'DKI Jakarta', city: 'Jakarta Pusat', districts: ['Cempaka Putih', 'Gambir', 'Johar Baru', 'Kemayoran', 'Menteng', 'Sawah Besar', 'Senen', 'Tanah Abang'] },
    { province: 'DKI Jakarta', city: 'Jakarta Utara', districts: ['Cilincing', 'Kelapa Gading', 'Koja', 'Pademangan', 'Penjaringan', 'Tanjung Priok'] },
    { province: 'DKI Jakarta', city: 'Jakarta Barat', districts: ['Cengkareng', 'Grogol Petamburan', 'Kebon Jeruk', 'Kalideres', 'Palmerah', 'Tambora', 'Taman Sari', 'Kembangan'] },
    { province: 'DKI Jakarta', city: 'Jakarta Selatan', districts: ['Cilandak', 'Jagakarsa', 'Kebayoran Baru', 'Kebayoran Lama', 'Mampang Prapatan', 'Pasar Minggu', 'Pancoran', 'Pesanggrahan', 'Tebet', 'Setiabudi'] },
    { province: 'DKI Jakarta', city: 'Jakarta Timur', districts: ['Cakung', 'Cipayung', 'Ciracas', 'Duren Sawit', 'Jatinegara', 'Kramat Jati', 'Makasar', 'Matraman', 'Pasar Rebo', 'Pulo Gadung'] },
    { province: 'Jawa Barat', city: 'Kota Depok', districts: ['Beji', 'Bojongsari', 'Cilodong', 'Cimanggis', 'Cinere', 'Cipayung', 'Limo', 'Pancoran Mas', 'Sawangan', 'Sukmajaya', 'Tapos'] },
    { province: 'Jawa Barat', city: 'Kabupaten Bogor', districts: ['Babakan Madang', 'Bojonggede', 'Caringin', 'Cariu', 'Ciampea', 'Ciawi', 'Cibinong', 'Cibungbulang', 'Cigombong', 'Cijeruk', 'Cigudeg', 'Cileungsi', 'Ciomas', 'Cisarua', 'Ciseeng', 'Citeureup', 'Dramaga', 'Gunung Putri', 'Gunung Sindur', 'Jasinga', 'Jonggol', 'Kemang', 'Klapanunggal', 'Leuwiliang', 'Leuwisadeng', 'Megamendung', 'Nanggung', 'Pamijahan', 'Parung', 'Parung Panjang', 'Rancabungur', 'Sukajaya', 'Sukamakmur', 'Sukaraja', 'Tajurhalang', 'Tamansari', 'Tanjungsari', 'Tenjo', 'Tenjolaya', 'Kelapa Nunggal'] },
    { province: 'Jawa Barat', city: 'Kabupaten Bekasi', districts: ['Babelan', 'Bojongmangu', 'Cabangbungin', 'Cibarusah', 'Cibitung', 'Cikarang Barat', 'Cikarang Pusat', 'Cikarang Selatan', 'Cikarang Timur', 'Cikarang Utara', 'Karangbahagia', 'Kedungwaringin', 'Muaragembong', 'Pebayuran', 'Serang Baru', 'Setu', 'Sukakarya', 'Sukatani', 'Sukawangi', 'Tambelang', 'Tambun Selatan', 'Tambun Utara', 'Tarumajaya'] },
    { province: 'Banten', city: 'Kabupaten Tangerang', districts: ['Balaraja', 'Cikupa', 'Cisauk', 'Cisoka', 'Curug', 'Gunung Kaler', 'Jambe', 'Jayanti', 'Kelapa Dua', 'Kemiri', 'Kresek', 'Kronjo', 'Kosambi', 'Legok', 'Mauk', 'Mekarbaru', 'Pagedangan', 'Pakuhaji', 'Panongan', 'Pasar Kemis', 'Rajeg', 'Sepatan', 'Sepatan Timur', 'Sindang Jaya', 'Solear', 'Sukadiri', 'Sukamulya', 'Teluknaga', 'Tigaraksa'] },
    { province: 'Banten', city: 'Kota Tangerang Selatan', districts: ['Ciputat', 'Ciputat Timur', 'Pamulang', 'Pondok Aren', 'Serpong', 'Serpong Utara', 'Setu'] },
    { province: 'Banten', city: 'Kota Tangerang', districts: ['Tangerang', 'Jatiuwung', 'Batuceper', 'Benda', 'Cipondoh', 'Ciledug', 'Karawaci', 'Periuk', 'Cibodas', 'Neglasari', 'Pinang', 'Karang Tengah', 'Larangan'] }
];

// Definisikan batas area pencarian untuk OpenCage (min_lon, min_lat, max_lon, max_lat)
const JABODETABEK_BOUNDS = '106.3,-6.8,107.2,-5.9';

/**
 * Fungsi utama untuk menjalankan proses seeding.
 */
async function main() {
    // Validasi API Key
    if (!OPENCAGE_API_KEY) {
        throw new Error("Error: OPENCAGE_API_KEY tidak ditemukan. Harap set di file .env Anda.");
    }
    console.log(`Mulai proses seeding menggunakan OpenCage API...`);

    console.log('Menghapus data alamat lama...');
    await prisma.address.deleteMany({});
    console.log('Data lama berhasil dihapus.');

    for (const area of JABODETABEK_AREAS) {
        for (const district of area.districts) {
            console.log(`Mengambil data untuk: Kecamatan ${district}, ${area.city}...`);

            // **LANGKAH 3: Buat URL untuk OpenCage API**
            const query = `Kecamatan ${district}, ${area.city}`;
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=100&countrycode=id&bounds=${JABODETABEK_BOUNDS}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const addressesToCreate = data.results
                        .map(result => {
                            // **LANGKAH 4: Parsing respons OpenCage yang terstruktur**
                            const { components, geometry } = result;
                            if (!components || !geometry) return null;

                            // Ambil nama kelurahan (village lebih diutamakan)
                            const subdistrict = components.village || components.suburb;
                            if (!subdistrict) return null;

                            return {
                                province: area.province, // Ambil provinsi dari variabel loop
                                city: area.city,         // Ambil kota dari variabel loop
                                district: district,      // Ambil kecamatan dari variabel loop
                                subdistrict: subdistrict,
                                latitude: geometry.lat,
                                longitude: geometry.lng, // OpenCage menggunakan 'lng'
                            };
                        })
                        .filter(Boolean); // Hapus entri null

                    if (addressesToCreate.length > 0) {
                        await prisma.address.createMany({
                            data: addressesToCreate,
                            skipDuplicates: true,
                        });
                        console.log(`  -> Berhasil menyimpan ${addressesToCreate.length} alamat untuk Kecamatan ${district}.`);
                    } else {
                        console.warn(`  -> Tidak ada alamat valid yang bisa disimpan untuk Kecamatan ${district}.`);
                    }
                } else {
                    console.warn(`  -> Tidak ditemukan lokasi untuk Kecamatan ${district}. Status: ${data.status.message}`);
                }
                
                // Jeda 1 detik untuk mematuhi batas rate API (1 req/detik untuk free trial)
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Gagal mengambil data untuk ${district}:`, error);
            }
        }
    }

    console.log(`Proses seeding selesai.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });