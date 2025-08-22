-- DropForeignKey
ALTER TABLE "public"."Stakeholder" DROP CONSTRAINT "Stakeholder_businessUnitId_fkey";

-- AlterTable
ALTER TABLE "public"."Stakeholder" ALTER COLUMN "businessUnitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Stakeholder" ADD CONSTRAINT "Stakeholder_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
