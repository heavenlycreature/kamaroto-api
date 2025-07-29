/*
  Warnings:

  - You are about to drop the column `password` on the `co_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `mitra_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "co_profiles" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "mitra_profiles" DROP COLUMN "password";
