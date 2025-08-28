// src/api/middlewares/productUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan path tujuan khusus untuk gambar produk
const uploadPath = 'public/uploads/products';

// Pastikan direktori tujuan ada
fs.mkdirSync(uploadPath, { recursive: true });

// Konfigurasi storage yang lebih sederhana dan spesifik
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // Langsung ke folder produk, tanpa if/else
  },
  filename: (req, file, cb) => {
    // Nama file yang unik dengan prefix 'product'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `product-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Filter file (bisa kita gunakan kembali logika yang sama)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: Hanya file gambar (jpeg, jpg, png, gif, webp) yang diizinkan!'));
};

const productUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Batas ukuran file 5MB
  fileFilter: fileFilter
});

module.exports = productUpload;