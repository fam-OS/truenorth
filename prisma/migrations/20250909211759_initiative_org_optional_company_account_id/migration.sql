-- AlterTable
ALTER TABLE "public"."Initiative" ADD COLUMN     "companyAccountId" TEXT,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Stakeholder" ADD COLUMN     "relationshipNotes" TEXT;

-- CreateIndex
CREATE INDEX "Initiative_companyAccountId_idx" ON "public"."Initiative"("companyAccountId");

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_companyAccountId_fkey" FOREIGN KEY ("companyAccountId") REFERENCES "public"."CompanyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
