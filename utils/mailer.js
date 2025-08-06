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

module.exports = { sendVerificationEmail };