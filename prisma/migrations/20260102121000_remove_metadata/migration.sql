/*
  Warnings:

  - You are about to drop the column `metadata` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Club" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "metadata";
