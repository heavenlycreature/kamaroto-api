// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi storage untuk penyimpanan lokal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/others';
    // Cek URL request untuk menentukan folder tujuan
    if (
      req.originalUrl.includes('/register/captain') ||
      (req.originalUrl.includes('/resubmit') && req.user?.role === 'co')
    ) {
      // registrasi/resubmit Captain (CO)
      uploadPath = 'public/uploads/selfies';
    } else if (
      req.originalUrl.includes('/register/mitra') ||
      (req.originalUrl.includes('/resubmit') && req.user?.role === 'mitra')
    ) {
      // registrasi/resubmit Mitra
      uploadPath = 'public/uploads/stores';
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Buat nama file yang unik untuk menghindari konflik
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    let prefix = 'file-';

    if (
      req.originalUrl.includes('/register/captain') ||
      (req.originalUrl.includes('/resubmit') && req.user?.role === 'co')
    ) {
      prefix = 'selfie-';
    } else if (
      req.originalUrl.includes('/register/mitra') ||
      (req.originalUrl.includes('/resubmit') && req.user?.role === 'mitra')
    ) {
      prefix = 'store-';
    }

    cb(null, `${prefix}${uniqueSuffix}`);
  }
});

// Filter file untuk hanya menerima format gambar tertentu
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: Hanya file gambar (jpeg, jpg, png, gif) yang diizinkan!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Batas ukuran file 5MB
  fileFilter: fileFilter
});

module.exports = upload;
