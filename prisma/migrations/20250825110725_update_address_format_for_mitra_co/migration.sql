/*
  Warnings:

  - You are about to drop the column `address_city` on the `co_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address_province` on the `co_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address_subdistrict` on the `co_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address_village` on the `co_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `business_address_city` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `business_address_province` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `business_address_subdistrict` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `business_address_village` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `owner_address_city` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `owner_address_province` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `owner_address_subdistrict` on the `mitra_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `owner_address_village` on the `mitra_profiles` table. All the data in the column will be lost.
  - Added the required column `address_district_code` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_district_name` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_postal_code` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_province_code` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_province_name` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_regency_code` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_regency_name` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_village_code` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address_village_name` to the `co_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_district_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_district_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_postal_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_province_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_province_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_regency_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_regency_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_village_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_address_village_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_district_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_district_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_postal_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_province_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_province_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_regency_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_regency_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_village_code` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_address_village_name` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "mitra_profiles_pic_phone_key";

-- AlterTable
ALTER TABLE "co_profiles" DROP COLUMN "address_city",
DROP COLUMN "address_province",
DROP COLUMN "address_subdistrict",
DROP COLUMN "address_village",
ADD COLUMN     "address_district_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "address_district_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "address_postal_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "address_province_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "address_province_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "address_regency_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "address_regency_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "address_village_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "address_village_name" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "mitra_profiles" DROP COLUMN "business_address_city",
DROP COLUMN "business_address_province",
DROP COLUMN "business_address_subdistrict",
DROP COLUMN "business_address_village",
DROP COLUMN "owner_address_city",
DROP COLUMN "owner_address_province",
DROP COLUMN "owner_address_subdistrict",
DROP COLUMN "owner_address_village",
ADD COLUMN     "business_address_district_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "business_address_district_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "business_address_postal_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "business_address_province_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "business_address_province_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "business_address_regency_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "business_address_regency_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "business_address_village_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "business_address_village_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "owner_address_district_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "owner_address_district_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "owner_address_postal_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "owner_address_province_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "owner_address_province_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "owner_address_regency_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "owner_address_regency_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "owner_address_village_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "owner_address_village_name" VARCHAR(100) NOT NULL;
