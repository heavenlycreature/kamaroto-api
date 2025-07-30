const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

const prisma = new PrismaClient();

/**
 * Mendaftarkan user Mitra baru beserta profilnya dalam satu transaksi.
 */
exports.registerMitra = async (req, res) => {
  // 1. Ambil semua data dari body (user & profile)
  const {
    name, email, password, phone, // Data untuk tabel 'users'
    // Data untuk tabel 'mitra_profiles'
    pic_name, pic_phone, pic_email, pic_status,
    owner_name, owner_phone, owner_email, owner_ktp,
    owner_address_province, owner_address_city, owner_address_subdistrict, owner_address_village, owner_address_detail,
    business_type, business_entity, business_name,
    business_address_province, business_address_city, business_address_subdistrict, business_address_village, business_address_detail,
    business_duration, social_media_platform, social_media_account, latitude, longitude
  } = req.body;

  try {
    // 2. Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Gunakan nested write untuk membuat User dan MitraProfile sekaligus (transaksional)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'mitra',
        status: 'pending', // Status default adalah pending
        mitraProfile: {
          create: {
            pic_name, pic_phone, pic_email, pic_status,
            owner_name, owner_phone, owner_email, owner_ktp,
            owner_address_province, owner_address_city, owner_address_subdistrict, owner_address_village, owner_address_detail,
            business_type, business_entity, business_name,
            business_address_province, business_address_city, business_address_subdistrict, business_address_village, business_address_detail,
            business_duration, social_media_platform, social_media_account, latitude, longitude
          },
        },
      },
      // Pilih data yang ingin dikembalikan
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    res.status(201).json({ message: 'Pendaftaran mitra berhasil, menunggu persetujuan admin.', user: newUser });

  } catch (error) {
    // Tangani error jika email sudah ada (Prisma error code P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ message: 'Email ini sudah terdaftar.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

/**
 * Mendaftarkan user CO (Credit Officer) baru beserta profilnya dalam satu transaksi.
 */
exports.registerCo = async (req, res) => {
  // Data teks ada di req.body
  const {
    name, email, password, phone, nik,
    birth_place, birth_date, gender,
    address_province, address_city, address_subdistrict, address_village, address_detail,
    job, marital_status, education, latitude, longitude 
  } = req.body;

  // Cek apakah file diunggah
  if (!req.file) {
    return res.status(400).json({ message: 'Gambar selfie wajib diunggah.' });
  }

  const birthDateObject = new Date(birth_date); // Ubah string menjadi objek Date
    if (isNaN(birthDateObject.getTime())) {
      // Jika string tidak valid (misal: "ini-bukan-tanggal"), kirim error yang jelas
      return res.status(400).json({ 
          message: "Format tanggal lahir tidak valid. Harap gunakan format yang sesuai" 
      });
    }

  // Buat URL yang bisa diakses publik dari nama file
  const selfie_url = `/uploads/selfies/${req.file.filename}`;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'co',
        status: 'pending',
        coProfile: {
          create: {
            name,
            email,
            nik,
            birth_place,
            birth_date: birthDateObject,
            gender,
            address_province,
            address_city,
            address_subdistrict,
            address_village,
            address_detail,
            job,
            marital_status,
            education,
            selfie_url: selfie_url,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        },
      },
      select: { id: true, email: true, status: true }
    });

    res.status(201).json({ message: 'Pendaftaran CO berhasil, menunggu persetujuan admin.', user: newUser });

  } catch (error) {
    // 1. Hapus file yang sudah terlanjur di-upload jika ada error database
    if (req.file) {
      try {
        await fs.unlink(req.file.path); // req.file.path berisi path lengkap ke file
        console.log(`File ${req.file.filename} dihapus karena registrasi gagal.`);
      } catch (unlinkError) {
        // Jika penghapusan file juga gagal, cukup log error-nya
        console.error(`Error saat menghapus file ${req.file.filename}:`, unlinkError);
      }
    }

    // 2. Kirim respons error yang sesuai ke frontend
    console.error('Registration error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const field = error.meta.target[0];
        return res.status(400).json({
            message: `Data pada kolom '${field}' sudah digunakan.`,
            field: field 
        });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

/**
 * Proses login untuk semua user (admin, mitra, co, customer).
 */
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari user HANYA di tabel 'users' berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Jika user tidak ditemukan atau password salah, kirim response yang sama
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // 3. Cek status user. Hanya yang 'approved' (atau 'active' untuk non-mitra/co) yang boleh login
    if (user.status !== 'approved' && user.status !== 'active') { // 'active' mungkin untuk admin/customer
      return res.status(403).json({ message: `Akun Anda berstatus '${user.status}'. Silakan hubungi admin.` });
    }

    // 4. Jika semua valid, buat JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
};