/*
  Warnings:

  - A unique constraint covering the columns `[founderId]` on the table `CompanyAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyAccountId,email]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropIndex
DROP INDEX "public"."OpsReview_ownerId_idx";

-- DropIndex
DROP INDEX "public"."OpsReview_teamId_idx";

-- DropIndex
DROP INDEX "public"."Team_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Team_organizationId_name_key";

-- DropIndex
DROP INDEX "public"."TeamMember_teamId_email_key";

-- AlterTable
ALTER TABLE "public"."TeamMember" ADD COLUMN     "companyAccountId" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAccount_founderId_key" ON "public"."CompanyAccount"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_companyAccountId_email_key" ON "public"."TeamMember"("companyAccountId", "email");

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_companyAccountId_fkey" FOREIGN KEY ("companyAccountId") REFERENCES "public"."CompanyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
