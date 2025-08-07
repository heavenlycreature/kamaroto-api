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

/**
 * Mengirim email notifikasi bahwa akun telah disetujui.
 * @param {string} to Alamat email penerima.
 * @param {string} name Nama pengguna untuk personalisasi.
 */
const sendApprovalEmail = async (to, name) => {
    const loginLink = 'http://localhost:5173/login'; // URL halaman login Anda

    const mailOptions = {
        from: `"KamarOTO" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: 'Selamat! Akun KamarOTO Anda Telah Disetujui',
        html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Pendaftaran Anda Disetujui!</h2>
                <p>Selamat, ${name}! Akun Anda telah berhasil diverifikasi dan disetujui oleh admin kami.</p>
                <p>Anda sekarang dapat login dan mulai menggunakan semua fitur yang tersedia di KamarOTO.</p>
                <a href="${loginLink}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Login Sekarang
                </a>
                <p>Terima kasih telah bergabung dengan kami.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email persetujuan terkirim ke: ${to}`);
    } catch (error) {
        // Sesuai tips Anda, kita log error jika pengiriman gagal
        console.error(`Gagal mengirim email persetujuan ke ${to}:`, error);
    }
};

/**
 * Mengirim email notifikasi ke admin bahwa ada pendaftaran baru.
 * @param {object} newUser Objek user yang baru saja mendaftar.
 */
const sendNewRegistrationNotification = async (newUser) => {
    const adminEmail = process.env.ADMIN_EMAIL; // Ambil email admin dari .env

    // Jangan lakukan apa-apa jika email admin tidak di-set
    if (!adminEmail) {
        console.warn("ADMIN_EMAIL tidak diatur di file .env. Notifikasi ke admin tidak terkirim.");
        return;
    }

    const dashboardLink = 'http://localhost:5173/admin/approval'; // URL ke halaman persetujuan

    const mailOptions = {
        from: `"Notifikasi Sistem KamarOTO" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `Pendaftaran Baru Menunggu Persetujuan: ${newUser.name}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Pendaftaran Baru</h2>
                <p>Pengguna baru telah mendaftar dan menunggu persetujuan Anda.</p>
                <hr>
                <p><strong>Nama:</strong> ${newUser.name}</p>
                <p><strong>Email:</strong> ${newUser.email}</p>
                <p><strong>Mendaftar Sebagai:</strong> ${newUser.role.toUpperCase()}</p>
                <hr>
                <p>Silakan tinjau pendaftaran ini melalui dasbor admin Anda.</p>
                <a href="${dashboardLink}" style="background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Buka Halaman Persetujuan
                </a>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notifikasi pendaftaran baru terkirim ke admin: ${adminEmail}`);
    } catch (error) {
        console.error(`Gagal mengirim notifikasi pendaftaran ke admin:`, error);
    }
};

/**
 * Mengirim email notifikasi bahwa akun telah ditolak.
 * @param {string} to Alamat email penerima.
 * @param {string} name Nama pengguna.
 * @param {string} reason Alasan penolakan dari admin.
 * @param {boolean} canResubmit Apakah pengguna diizinkan mendaftar ulang.
 */
const sendRejectionEmail = async (to, name, reason, canResubmit) => {
    const loginLink = 'http://localhost:5173/login'; // URL halaman login

    let resubmitMessage = `
        <p>Saat ini, Anda tidak diizinkan untuk mendaftar ulang. Silakan hubungi tim support kami jika Anda merasa ini adalah sebuah kesalahan.</p>
    `;

    if (canResubmit) {
        resubmitMessage = `
            <p>Anda diizinkan untuk memperbaiki data Anda dan mengirim ulang pendaftaran. Silakan login kembali ke akun Anda untuk melihat detail dan melakukan pendaftaran ulang.</p>
            <a href="${loginLink}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                Login & Daftar Ulang
            </a>
        `;
    }

    const mailOptions = {
        from: `"Notifikasi Akun KamarOTO" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: 'Informasi Mengenai Pendaftaran Akun KamarOTO Anda',
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Pendaftaran Anda Memerlukan Perhatian</h2>
                <p>Halo ${name},</p>
                <p>Setelah melakukan peninjauan, kami informasikan bahwa pendaftaran Anda saat ini belum dapat kami setujui. Berikut adalah detailnya:</p>
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0;">Alasan Penolakan:</h4>
                    <p style="margin-bottom: 0;">${reason}</p>
                </div>
                ${resubmitMessage}
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email penolakan terkirim ke: ${to}`);
    } catch (error) {
        console.error(`Gagal mengirim email penolakan ke ${to}:`, error);
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendApprovalEmail, sendNewRegistrationNotification, sendRejectionEmail };