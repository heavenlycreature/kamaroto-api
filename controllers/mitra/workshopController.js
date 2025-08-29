const workshopService = require('../../services/mitra/workshopService');

// === MEKANIK CONTROLLERS ===

exports.createMechanic = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const data = req.body;
        const file = req.file; // Hasil dari .single('photo') adalah `req.file`

        const mechanic = await workshopService.createMechanic(mitraProfileId, data, file);
        res.status(201).json({ message: 'Mekanik baru berhasil ditambahkan.', data: mechanic });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllMechanics = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const mechanics = await workshopService.getAllMechanicsByMitra(mitraProfileId);
        res.status(200).json({ data: mechanics });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data mekanik.', error: error.message });
    }
};

exports.getMechanicById = async (req, res) => {
    // Middleware `canAccessMechanic` sudah memastikan mekanik ada dan milik user
    // Kita bisa langsung mengirimkan data yang sudah di-fetch oleh middleware
    res.status(200).json({ data: req.mechanic });
};

exports.updateMechanic = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const data = req.body;
        const file = req.file;

        const updatedMechanic = await workshopService.updateMechanic(mechanicId, data, file);
        res.status(200).json({ message: 'Data mekanik berhasil diperbarui.', data: updatedMechanic });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMechanic = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        await workshopService.deleteMechanic(mechanicId);
        res.status(204).send(); // Sukses tanpa konten
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus mekanik.', error: error.message });
    }
};