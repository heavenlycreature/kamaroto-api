/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `co_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nik` to the `co_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "co_profiles" ADD COLUMN     "nik" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "co_profiles_nik_key" ON "co_profiles"("nik");
