const bcrypt = require('bcrypt');

// Ekspor fungsi yang menerima instance prisma sebagai argumen
async function seedAdmin(prisma) {
  console.log('Mengecek atau membuat user admin...');

  const adminEmail = 'admin@kamaroto.com';
  const adminPassword = 'kamarotohargamati';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin KamarOTO',
      email: adminEmail,
      password: hashedPassword,
      phone: '081234567890',
      role: 'admin',
      status: 'active',
    },
  });

  console.log('User admin berhasil dibuat/ditemukan:', adminUser.email);
}

module.exports = { seedAdmin };