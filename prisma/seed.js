const { PrismaClient } = require('@prisma/client');
const { seedAdmin } = require('./seeders/adminSeeder');
const { seedAddress } = require('./seeders/addressSeeder');

const prisma = new PrismaClient();

async function main() {
    console.log(`Mulai proses seeding...`);

    // Ambil argumen dari command line untuk menjalankan seeder spesifik
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Jika tidak ada argumen, jalankan semua seeder
        console.log('Menjalankan semua seeder...');
        await seedAdmin(prisma);
        // await seedAddress(prisma); // Aktifkan jika ingin menjalankan seed alamat
    } else {
        // Jalankan seeder berdasarkan argumen
        for (const arg of args) {
            if (arg === 'admin') {
                await seedAdmin(prisma);
            }
            if (arg === 'address') {
                await seedAddress(prisma); // Aktifkan jika ingin menjalankan seed alamat
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