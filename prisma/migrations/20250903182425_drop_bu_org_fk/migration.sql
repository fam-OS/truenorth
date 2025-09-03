/*
  Warnings:

  - You are about to drop the column `organizationId` on the `BusinessUnit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BusinessUnit" DROP CONSTRAINT "BusinessUnit_organizationId_fkey";

-- AlterTable
ALTER TABLE "public"."BusinessUnit" DROP COLUMN "organizationId";
