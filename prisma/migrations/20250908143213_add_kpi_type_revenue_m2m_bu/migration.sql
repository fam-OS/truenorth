-- CreateEnum
CREATE TYPE "public"."KPIType" AS ENUM ('QUALITATIVE', 'QUANTITATIVE');

-- AlterTable
ALTER TABLE "public"."Kpi" ADD COLUMN     "kpiType" "public"."KPIType",
ADD COLUMN     "revenueImpacting" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."KpiBusinessUnit" (
    "id" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiBusinessUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KpiBusinessUnit_businessUnitId_idx" ON "public"."KpiBusinessUnit"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiBusinessUnit_kpiId_businessUnitId_key" ON "public"."KpiBusinessUnit"("kpiId", "businessUnitId");

-- AddForeignKey
ALTER TABLE "public"."KpiBusinessUnit" ADD CONSTRAINT "KpiBusinessUnit_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "public"."Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KpiBusinessUnit" ADD CONSTRAINT "KpiBusinessUnit_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
