/*
  Warnings:

  - Made the column `teamMemberId` on table `Stakeholder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Stakeholder" DROP CONSTRAINT "Stakeholder_teamMemberId_fkey";

-- AlterTable
ALTER TABLE "public"."Stakeholder" ALTER COLUMN "teamMemberId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Stakeholder" ADD CONSTRAINT "Stakeholder_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "public"."TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
