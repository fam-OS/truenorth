/*
  Warnings:

  - You are about to drop the column `actualRevenue` on the `Kpi` table. All the data in the column will be lost.
  - You are about to drop the column `forecastedRevenue` on the `Kpi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Kpi" DROP COLUMN "actualRevenue",
DROP COLUMN "forecastedRevenue";

-- CreateTable
CREATE TABLE "public"."KpiStatus" (
    "id" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" "public"."Quarter" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KpiStatus_kpiId_idx" ON "public"."KpiStatus"("kpiId");

-- CreateIndex
CREATE INDEX "KpiStatus_year_idx" ON "public"."KpiStatus"("year");

-- AddForeignKey
ALTER TABLE "public"."KpiStatus" ADD CONSTRAINT "KpiStatus_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "public"."Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
