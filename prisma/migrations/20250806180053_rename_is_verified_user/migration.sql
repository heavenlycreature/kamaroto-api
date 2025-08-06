/*
  Warnings:

  - You are about to drop the column `is_verified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_verified",
ADD COLUMN     "email_is_verified" BOOLEAN NOT NULL DEFAULT false;
