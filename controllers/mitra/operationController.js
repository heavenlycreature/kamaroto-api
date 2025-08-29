const operationService = require('../../services/mitra/operationService');

// === MEKANIK CONTROLLERS ===

exports.createStaff = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const data = req.body;
        const file = req.file; // Hasil dari .single('photo') adalah `req.file`

        const staff = await operationService.createStaff(mitraProfileId, data, file);
        res.status(201).json({ message: 'Mekanik baru berhasil ditambahkan.', data: staff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllStaff = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const { role } = req.query;
        const staff = await operationService.getAllStaffByMitra(mitraProfileId, role);
        res.status(200).json({ data: staff });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data mekanik.', error: error.message });
    }
};

exports.getStaffById = async (req, res) => {
    // Middleware `canAccessMechanic` sudah memastikan mekanik ada dan milik user
    // Kita bisa langsung mengirimkan data yang sudah di-fetch oleh middleware
    res.status(200).json({ data: req.staff });
};

exports.updateStaff = async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const data = req.body;
        const file = req.file;

        const updatedStaff = await operationService.updateStaff(mechanicId, data, file);
        res.status(200).json({ message: 'Data mekanik berhasil diperbarui.', data: updatedStaff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        await operationService.deleteStaff(staffId);
        res.status(204).send(); // Sukses tanpa konten
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus mekanik.', error: error.message });
    }
};

exports.getWorkshopSlotsByDate = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const { date } = req.query; // Ambil tanggal dari query parameter

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' });
        }

        const slots = await operationService.getSlotsByDate(mitraProfileId, date, 'WORKSHOP');
        res.status(200).json({ data: slots });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data slot.', error: error.message });
    }
};

exports.upsertWorkshopSlot = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const slotData = req.body; // Berisi date, hour, capacity, mechanicsAvailable

        // Tambahkan validasi input di sini jika perlu

        const slot = await operationService.upsertSlot(mitraProfileId, slotData, 'WORKSHOP');
        res.status(200).json({ message: 'Slot berhasil disimpan.', data: slot });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.bulkUpdateWorkshopSlots = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const bulkData = req.body; // Berisi startDate, endDate, daysOfWeek, dll.
        
        // Tambahkan validasi input yang ketat di sini jika perlu

        await operationService.bulkUpdateSlots(mitraProfileId, bulkData, 'WORKSHOP');
        res.status(200).json({ message: 'Jadwal berhasil diperbarui secara massal.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getWashSlotsByDate = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const { date } = req.query;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' });
        }
        
        // Memanggil service yang sama dengan tipe 'WASH'
        const slots = await operationService.getSlotsByDate(mitraProfileId, date, 'WASH');
        res.status(200).json({ data: slots });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data slot cuci.', error: error.message });
    }
};

exports.upsertWashSlot = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const slotData = req.body; // Hanya akan berisi date, hour, capacity

        const slot = await operationService.upsertSlot(mitraProfileId, slotData, 'WASH');
        res.status(200).json({ message: 'Slot cuci berhasil disimpan.', data: slot });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.bulkUpdateWashSlots = async (req, res) => {
    try {
        const mitraProfileId = req.user.mitraProfile.id;
        const bulkData = req.body; // Tidak akan berisi mechanicsAvailable
        
        await operationService.bulkUpdateSlots(mitraProfileId, bulkData, 'WASH');
        res.status(200).json({ message: 'Jadwal cuci berhasil diperbarui secara massal.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};