/*
  Warnings:

  - You are about to drop the column `mechanicsAvailable` on the `WorkshopSlot` table. All the data in the column will be lost.
  - You are about to drop the `Mechanic` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `staffAvailable` to the `WashSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffAvailable` to the `WorkshopSlot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('MECHANIC', 'WASHER');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('AVAILABLE', 'ON_LEAVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Mechanic" DROP CONSTRAINT "Mechanic_mitraProfileId_fkey";

-- AlterTable
ALTER TABLE "WashSlot" ADD COLUMN     "staffAvailable" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "WorkshopSlot" DROP COLUMN "mechanicsAvailable",
ADD COLUMN     "staffAvailable" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Mechanic";

-- DropEnum
DROP TYPE "MechanicStatus";

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillset" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'AVAILABLE',
    "photoUrl" TEXT,
    "role" "StaffRole" NOT NULL,
    "mitraProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_mitraProfileId_fkey" FOREIGN KEY ("mitraProfileId") REFERENCES "mitra_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
