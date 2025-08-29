const { PrismaClient } = require('@prisma/client')
const { eachDayOfInterval, getDay } = require('date-fns');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

exports.createStaff = async (mitraProfileId, data, file) => {
    const { name, skillset, status, role } = data;

    if (!role || !['MECHANIC', 'WASHER'].includes(role)) {
        throw new Error('Peran staf tidak valid.');
    }

    const dataToSave = {
        name,
        skillset,
        status,
        mitraProfileId,
    };

    if (file) {
        dataToSave.photoUrl = `/uploads/mechanics/${file.filename}`;
    }

    return prisma.mechanic.create({ data: dataToSave });
};

exports.getAllStaffByMitra = (mitraProfileId, role) => {
    const whereClause = { mitraProfileId };
     if (role && ['MECHANIC', 'WASHER'].includes(role)) {
        whereClause.role = role; 
    }
    return prisma.staff.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
};

exports.getStaffById = (staffId) => {
    return prisma.mechanic.findUniqueOrThrow({ where: { id: staffId } });
};

exports.updateStaff = async (staffId, data, file) => {
    const { name, skillset, status } = data;
    const dataToUpdate = { name, skillset, status };

    if (file) {
        const currentMechanic = await prisma.mechanic.findUnique({
            where: { id: staffId },
            select: { photoUrl: true }
        });

        if (currentMechanic && currentMechanic.photoUrl) {
            try {
                const oldPath = path.join(process.cwd(), 'public', currentMechanic.photoUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (err) {
                console.error(`Gagal menghapus foto lama mekanik: ${err.message}`);
            }
        }
        dataToUpdate.photoUrl = `/uploads/mechanics/${file.filename}`;
    }

    return prisma.mechanic.update({
        where: { id: staffId },
        data: dataToUpdate,
    });
};

/**
 * Mengambil semua slot untuk tanggal tertentu.
 * @param {number} mitraProfileId 
 * @param {string} dateString - Tanggal dalam format "YYYY-MM-DD"
 * @param {'WORKSHOP'|'WASH'} type - Tipe slot
 * @returns {Promise<Array>}
 */
exports.getSlotsByDate = (mitraProfileId, dateString, type) => {
    const model = type === 'WORKSHOP' ? prisma.workshopSlot : prisma.washSlot;
    return model.findMany({
        where: {
            mitraProfileId,
            date: new Date(dateString)
        },
        orderBy: { hour: 'asc' }
    });
};

/**
 * Membuat atau memperbarui (Upsert) satu slot waktu.
 * @param {number} mitraProfileId 
 * @param {object} slotData - { date, hour, capacity, staffAvailable? }
 * @param {'WORKSHOP'|'WASH'} type - Tipe slot
 * @returns {Promise<object>}
 */
exports.upsertSlot = (mitraProfileId, slotData, type) => {
    const { date, hour, capacity, staffAvailable } = slotData;
    const model = type === 'WORKSHOP' ? prisma.workshopSlot : prisma.washSlot;

     const data = { mitraProfileId, date: new Date(date), hour, capacity, staffAvailable };

    return model.upsert({
        where: { mitraProfileId_date_hour: { mitraProfileId, date: new Date(date), hour } },
        update: { capacity, staffAvailable }, 
        create: data,
    });
};

/**
 * Membuat atau memperbarui beberapa slot sekaligus.
 * @param {number} mitraProfileId 
 * @param {object} bulkData - { startDate, endDate, daysOfWeek, startTime, endTime, capacity, staffAvailable? }
 * @param {'WORKSHOP'|'WASH'} type - Tipe slot
 * @returns {Promise<void>}
 */
exports.bulkUpdateSlots = async (mitraProfileId, bulkData, type) => {
    const { startDate, endDate, daysOfWeek, startTime, endTime, capacity, staffAvailable } = bulkData;
    const model = type === 'WORKSHOP' ? prisma.workshopSlot : prisma.washSlot;
    
    // 1. Generate semua tanggal dalam rentang yang dipilih
    const allDates = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate)
    });

    // 2. Filter tanggal berdasarkan hari yang dipilih (Minggu=0, Senin=1, ...)
    const targetDates = allDates.filter(date => daysOfWeek.includes(getDay(date)));

    if (targetDates.length === 0) return; // Tidak ada yang perlu diupdate

    // 3. Siapkan semua operasi 'upsert' yang akan dijalankan
    const upsertOperations = [];
    for (const date of targetDates) {
        for (let hour = startTime; hour < endTime; hour++) {
            const data = { mitraProfileId, date, hour, capacity, staffAvailable };
            const operation = model.upsert({
                where: { mitraProfileId_date_hour: { mitraProfileId, date, hour } },
                update: { capacity, staffAvailable },
                create: data,
            });
            upsertOperations.push(operation);
        }
    }
    
    // 4. Jalankan semua operasi dalam satu transaksi database
    if (upsertOperations.length > 0) {
        await prisma.$transaction(upsertOperations);
    }
};

exports.deleteMechanic = async (staffId) => {
    const mechanic = await prisma.mechanic.findUnique({
        where: { id: staffId },
        select: { photoUrl: true }
    });

    await prisma.mechanic.delete({ where: { id: staffId } });

    if (mechanic && mechanic.photoUrl) {
        try {
            const filePath = path.join(process.cwd(), 'public', mechanic.photoUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Gagal menghapus foto mekanik: ${err.message}`);
        }
    }
};