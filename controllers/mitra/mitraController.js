const { geocodeAddressFlexible } = require('../../utils/geocode/flexibleGeocode');
const mitraService = require('../../services/mitra/mitraService');


exports.getMitraProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await mitraService.getMitraProfile(userId);
    return res.status(200).json(user);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ message: e.message });
    }
    console.error('Error fetching mitra profile:', e);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.updateMitraProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const updated = await mitraService.updateMitraProfile(userId, req.body, geocodeAddressFlexible);
    return res.status(200).json({ message: 'Profil mitra berhasil diperbarui.', user: updated });
  } catch (e) {
    // Mapping P2002 → pesan yang lebih spesifik
    if ((e instanceof Error && e.code === 'P2002') || (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) {
      const target = Array.isArray(e.target) ? e.target.join(',') : String(e.target || '');
      if (target.includes('email'))  return res.status(400).json({ message: 'Email sudah terdaftar.', detail: target });
      if (target.includes('phone'))  return res.status(400).json({ message: 'Nomor telepon sudah terdaftar.', detail: target });
      if (target.includes('owner_ktp')) return res.status(400).json({ message: 'Nomor KTP sudah terdaftar.', detail: target });
      return res.status(400).json({ message: 'Data melanggar batas unik.', detail: target });
    }

    console.error('Error updating mitra profile:', e);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};


exports.updateStoreInfo = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const updateData = req.body;
         const files = req.files;

        if (updateData.openHours) {
            updateData.openHours = JSON.parse(updateData.openHours);
        }
        const updatedProfile = await mitraService.updateStoreInfo(mitraProfileId, updateData, files);
        res.status(200).json({ message: 'Informasi toko berhasil diperbarui.', data: updatedProfile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

