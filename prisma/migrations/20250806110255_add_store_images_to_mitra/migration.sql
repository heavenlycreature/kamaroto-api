/*
  Warnings:

  - Added the required column `store_images` to the `mitra_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mitra_profiles" ADD COLUMN     "store_images" TEXT NOT NULL;
