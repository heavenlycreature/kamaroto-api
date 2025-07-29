/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `co_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `co_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "co_profiles" ADD COLUMN     "email" VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Address_province_city_district_subdistrict_key" ON "Address"("province", "city", "district", "subdistrict");

-- CreateIndex
CREATE UNIQUE INDEX "co_profiles_email_key" ON "co_profiles"("email");
