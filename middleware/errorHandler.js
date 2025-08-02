const multer = require('multer'); 

const errorHandler = (err, req, res, next) => {
   // 2. Tambahkan blok untuk menangani error spesifik dari Multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            // Kirim respons yang jelas jika file terlalu besar
            return res.status(400).json({
                success: false,
                error: `Ukuran file terlalu besar. Batas maksimal adalah 5MB.`
            });
        }
        // Bisa ditambahkan penanganan error Multer lain jika perlu
        // contoh: if (err.code === 'LIMIT_UNEXPECTED_FILE') { ... }
    }

    // Tangani error dari fileFilter kustom Anda
    if (err.message && err.message.includes('Hanya file gambar')) {
        return res.status(400).json({
            success: false,
            error: 'Tipe file tidak valid. Hanya gambar (jpeg, jpg, png, gif) yang diizinkan.'
        });
    }

    // 3. Jika bukan error Multer, lanjutkan ke logika error handler umum Anda
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

module.exports = errorHandler;
