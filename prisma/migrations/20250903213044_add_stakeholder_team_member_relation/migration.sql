/*
  Warnings:

  - A unique constraint covering the columns `[teamMemberId]` on the table `Stakeholder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Stakeholder" ADD COLUMN     "teamMemberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Stakeholder_teamMemberId_key" ON "public"."Stakeholder"("teamMemberId");

-- AddForeignKey
ALTER TABLE "public"."Stakeholder" ADD CONSTRAINT "Stakeholder_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
