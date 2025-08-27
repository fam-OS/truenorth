-- AlterTable
ALTER TABLE "public"."Initiative" ADD COLUMN     "businessUnitId" TEXT;

-- AlterTable
ALTER TABLE "public"."Kpi" ADD COLUMN     "businessUnitId" TEXT;

-- CreateIndex
CREATE INDEX "Initiative_businessUnitId_idx" ON "public"."Initiative"("businessUnitId");

-- CreateIndex
CREATE INDEX "Kpi_businessUnitId_idx" ON "public"."Kpi"("businessUnitId");

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Kpi" ADD CONSTRAINT "Kpi_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
