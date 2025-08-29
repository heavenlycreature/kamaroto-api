const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan path tujuan khusus untuk foto mekanik
const uploadPath = 'public/uploads/mechanics';
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nama file yang unik dengan prefix 'mechanic'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `mechanic-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Error: Hanya file gambar yang diizinkan!'));
  }
};

// Gunakan .single() karena kita hanya mengunggah satu foto per mekanik
// 'photo' adalah nama field yang akan dikirim dari frontend
const mechanicUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 }, // Batas 3MB
  fileFilter: fileFilter
}).single('photo');

module.exports = mechanicUpload;