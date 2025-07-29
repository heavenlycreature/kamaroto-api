-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'mitra', 'co', 'customer');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'approved', 'rejected', 'active');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "PicStatus" AS ENUM ('pemilik', 'pengelola');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('jual_beli_kendaraan', 'bengkel', 'cuci_kendaraan', 'jual_beli_sparepart', 'sewa_kendaraan', 'insurance_consultant', 'pembiayaan', 'biro_jasa');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "status" "Status" NOT NULL DEFAULT 'pending',
    "phone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "address_province" VARCHAR(100) NOT NULL,
    "address_city" VARCHAR(100) NOT NULL,
    "address_subdistrict" VARCHAR(100) NOT NULL,
    "address_village" VARCHAR(100) NOT NULL,
    "address_detail" TEXT NOT NULL,
    "job" VARCHAR(100) NOT NULL,
    "marital_status" VARCHAR(50) NOT NULL,
    "education" VARCHAR(50) NOT NULL,
    "selfie_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "co_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitra_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "pic_name" VARCHAR(100) NOT NULL,
    "pic_phone" VARCHAR(20) NOT NULL,
    "pic_email" VARCHAR(100) NOT NULL,
    "pic_status" "PicStatus" NOT NULL,
    "owner_name" VARCHAR(100) NOT NULL,
    "owner_phone" VARCHAR(20) NOT NULL,
    "owner_email" VARCHAR(100) NOT NULL,
    "owner_ktp" VARCHAR(50) NOT NULL,
    "owner_address_province" VARCHAR(100) NOT NULL,
    "owner_address_city" VARCHAR(100) NOT NULL,
    "owner_address_subdistrict" VARCHAR(100) NOT NULL,
    "owner_address_village" VARCHAR(100) NOT NULL,
    "owner_address_detail" TEXT NOT NULL,
    "business_type" "BusinessType" NOT NULL,
    "business_entity" VARCHAR(50) NOT NULL,
    "business_address_province" VARCHAR(100) NOT NULL,
    "business_address_city" VARCHAR(100) NOT NULL,
    "business_address_subdistrict" VARCHAR(100) NOT NULL,
    "business_address_village" VARCHAR(100) NOT NULL,
    "business_address_detail" TEXT NOT NULL,
    "business_duration" VARCHAR(50) NOT NULL,
    "social_media_platform" VARCHAR(50) NOT NULL,
    "social_media_account" VARCHAR(100) NOT NULL,

    CONSTRAINT "mitra_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "co_profiles_user_id_key" ON "co_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mitra_profiles_user_id_key" ON "mitra_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "co_profiles" ADD CONSTRAINT "co_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitra_profiles" ADD CONSTRAINT "mitra_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
