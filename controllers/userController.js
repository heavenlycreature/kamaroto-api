const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Menyetujui pendaftaran user (hanya mengubah status).
 */
exports.approveUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User ini sudah disetujui sebelumnya.' });
    }
    
    // Logika persetujuan disederhanakan: HANYA update status
    // Profil sudah ada sejak pendaftaran
    const approvedStatus = (user.role === 'mitra' || user.role === 'co') ? 'approved' : 'active';

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { status: approvedStatus },
      select: { id: true, email: true, role: true, status: true }
    });

    res.status(200).json({ message: `User ${user.role} berhasil disetujui.`, user: updatedUser });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menyetujui user.' });
  }
};

/**
 * Menolak pendaftaran user.
 * (Logika ini sudah cukup baik, hanya dirapikan sedikit)
 */
exports.rejectUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { status: 'rejected' },
      select: { id: true, email: true, role: true, status: true }
    });

    res.status(200).json({ message: 'User berhasil ditolak.', user: updatedUser });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat menolak user.' });
  }
};

/**
 * Mendapatkan semua user dengan status 'pending'.
 * (Logika ini sudah baik, tidak perlu diubah)
 */
exports.getAllPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'pending' },
      select: { id: true, name: true, email: true, role: true, phone: true, created_at: true },
    });
    res.status(200).json({ users: pendingUsers });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user pending.' });
  }
};

/**
 * Update profil CO/Mitra.
 * (Logika ini sudah baik karena beroperasi pada user yang sudah terotentikasi)
 * Pastikan middleware otentikasi Anda menyisipkan `req.user.id`
 */

exports.updateCoProfile = async (req, res) => {
  const userId = req.user.id; // Get user ID from authenticated token
  const updateData = req.body;

  try {
    const coProfile = await prisma.coProfile.findUnique({ where: { user_id: userId } });

    if (!coProfile) {
      return res.status(404).json({ message: 'CO profile not found.' });
    }

    const updatedCoProfile = await prisma.coProfile.update({
      where: { user_id: userId },
      data: updateData,
    });

    res.status(200).json({ message: 'CO profile updated successfully.', profile: updatedCoProfile });
  } catch (error) {
    console.error('Update CO profile error:', error);
    res.status(500).json({ message: 'Internal server error during CO profile update.' });
  }
};

exports.updateMitraProfile = async (req, res) => {
  const userId = req.user.id; // Get user ID from authenticated token
  const updateData = req.body;

  try {
    const mitraProfile = await prisma.mitraProfile.findUnique({ where: { user_id: userId } });

    if (!mitraProfile) {
      return res.status(404).json({ message: 'Mitra profile not found.' });
    }

    const updatedMitraProfile = await prisma.mitraProfile.update({
      where: { user_id: userId },
      data: updateData,
    });

    res.status(200).json({ message: 'Mitra profile updated successfully.', profile: updatedMitraProfile });
  } catch (error) {
    console.error('Update Mitra profile error:', error);
    res.status(500).json({ message: 'Internal server error during Mitra profile update.' });
  }
};