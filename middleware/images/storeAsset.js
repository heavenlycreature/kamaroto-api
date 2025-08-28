const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan path tujuan untuk aset toko (logo, banner)
const uploadPath = 'public/uploads/store-assets';
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gunakan fieldname (logo/banner) untuk prefix nama file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Filter file gambar (sama seperti sebelumnya)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Error: Hanya file gambar yang diizinkan!'));
  }
};

// [PENTING] Gunakan upload.fields() untuk menangani beberapa field file yang berbeda
const storeAssetUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 }, // Batas 3MB untuk logo/banner
  fileFilter: fileFilter
}).fields([
    { name: 'logo', maxCount: 1 },    // Terima 1 file dari field 'logo'
    { name: 'banner', maxCount: 1 }  // Terima 1 file dari field 'banner'
]);

module.exports = storeAssetUpload;