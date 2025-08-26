-- AlterTable
ALTER TABLE "public"."Stakeholder" ADD COLUMN     "reportsToId" TEXT;

-- AlterTable
ALTER TABLE "public"."TeamMember" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reportsToId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Stakeholder" ADD CONSTRAINT "Stakeholder_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "public"."Stakeholder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
