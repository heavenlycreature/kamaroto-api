/*
  Warnings:

  - Added the required column `birth_place` to the `co_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "co_profiles" ADD COLUMN     "birth_place" VARCHAR(100) NOT NULL;
