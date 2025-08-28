-- CreateEnum
CREATE TYPE "MechanicStatus" AS ENUM ('AVAILABLE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('VEHICLE', 'SPAREPART', 'SERVICE', 'WASH', 'RENTAL');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "mitra_profiles" ADD COLUMN     "business_banner_url" TEXT,
ADD COLUMN     "business_logo_url" TEXT,
ADD COLUMN     "openHours" JSONB;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "attributes" JSONB,
    "mitraProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDetail" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "odometer" INTEGER NOT NULL,
    "condition" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "VehicleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalVehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "fuelPolicy" TEXT NOT NULL,
    "dailyPrice" DECIMAL(10,2) NOT NULL,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "productId" TEXT NOT NULL,

    CONSTRAINT "RentalVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBlackout" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "rentalVehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalBlackout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mechanic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skillset" TEXT,
    "status" "MechanicStatus" NOT NULL DEFAULT 'AVAILABLE',
    "mitraProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mechanic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopSlot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "mechanicsAvailable" INTEGER NOT NULL,
    "mitraProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WashSlot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "mitraProfileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WashSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_mitraProfileId_idx" ON "Product"("mitraProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDetail_productId_key" ON "VehicleDetail"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalVehicle_plateNumber_key" ON "RentalVehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RentalVehicle_productId_key" ON "RentalVehicle"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopSlot_mitraProfileId_date_hour_key" ON "WorkshopSlot"("mitraProfileId", "date", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "WashSlot_mitraProfileId_date_hour_key" ON "WashSlot"("mitraProfileId", "date", "hour");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_mitraProfileId_fkey" FOREIGN KEY ("mitraProfileId") REFERENCES "mitra_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDetail" ADD CONSTRAINT "VehicleDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalVehicle" ADD CONSTRAINT "RentalVehicle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBlackout" ADD CONSTRAINT "RentalBlackout_rentalVehicleId_fkey" FOREIGN KEY ("rentalVehicleId") REFERENCES "RentalVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_mitraProfileId_fkey" FOREIGN KEY ("mitraProfileId") REFERENCES "mitra_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopSlot" ADD CONSTRAINT "WorkshopSlot_mitraProfileId_fkey" FOREIGN KEY ("mitraProfileId") REFERENCES "mitra_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WashSlot" ADD CONSTRAINT "WashSlot_mitraProfileId_fkey" FOREIGN KEY ("mitraProfileId") REFERENCES "mitra_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
