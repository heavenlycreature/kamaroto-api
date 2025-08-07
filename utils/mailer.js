const nodemailer = require('nodemailer');

// Konfigurasi transporter untuk Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Alamat email Anda
        pass: process.env.GMAIL_APP_PASSWORD, // Gunakan App Password, BUKAN password biasa
    },
});

const sendVerificationEmail = async (to, token) => {
    const verificationLink = `http://localhost:5173/verify?token=${token}`; // Ganti dengan URL frontend Anda

    const mailOptions = {
        from: `"KamarOTO" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: 'Verifikasi Alamat Email Anda',
        html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Selamat Datang di KamarOTO!</h2>
                <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda.</p>
                <a href="${verificationLink}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Verifikasi Email
                </a>
                <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
                <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Gagal mengirim email ke ${to}:`, error);
    }
};

const sendPasswordResetEmail = async (to, token) => {
    // Pastikan URL ini cocok dengan rute di frontend Anda
    const resetLink = `http://localhost:5173/reset-password?token=${token}`; 

    const mailOptions = {
        from: `"KamarOTO" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: 'Reset Password Akun KamarOTO Anda',
        html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Lupa Password?</h2>
                <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk melanjutkan.</p>
                <a href="${resetLink}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Reset Password
                </a>
                <p>Link ini akan kedaluwarsa dalam 15 menit.</p>
                <p>Jika Anda tidak merasa meminta ini, abaikan email ini.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email reset password terkirim ke: ${to}`);
    } catch (error) {
        console.error(`Gagal mengirim email reset password ke ${to}:`, error);
        // Penting: Jangan throw error di sini agar user tidak tahu emailnya ada atau tidak
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };