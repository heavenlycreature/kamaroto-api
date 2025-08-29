const { PrismaClient } = require('@prisma/client')
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

exports.createMechanic = async (mitraProfileId, data, file) => {
    const { name, skillset, status } = data;
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

exports.getAllMechanicsByMitra = (mitraProfileId) => {
    return prisma.mechanic.findMany({
        where: { mitraProfileId },
        orderBy: { createdAt: 'desc' }
    });
};

exports.getMechanicById = (mechanicId) => {
    return prisma.mechanic.findUniqueOrThrow({ where: { id: mechanicId } });
};

exports.updateMechanic = async (mechanicId, data, file) => {
    const { name, skillset, status } = data;
    const dataToUpdate = { name, skillset, status };

    if (file) {
        const currentMechanic = await prisma.mechanic.findUnique({
            where: { id: mechanicId },
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
        where: { id: mechanicId },
        data: dataToUpdate,
    });
};

exports.deleteMechanic = async (mechanicId) => {
    const mechanic = await prisma.mechanic.findUnique({
        where: { id: mechanicId },
        select: { photoUrl: true }
    });

    await prisma.mechanic.delete({ where: { id: mechanicId } });

    if (mechanic && mechanic.photoUrl) {
        try {
            const filePath = path.join(process.cwd(), 'public', mechanic.photoUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Gagal menghapus foto mekanik: ${err.message}`);
        }
    }
};