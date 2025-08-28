-- CreateEnum
CREATE TYPE "public"."InitiativeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."CostType" AS ENUM ('SOFTWARE', 'TRAINING', 'SALARY', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Initiative" ADD COLUMN     "atRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "public"."InitiativeStatus";

-- CreateTable
CREATE TABLE "public"."HeadcountTracker" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "organizationId" TEXT,
    "year" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "q1Forecast" INTEGER NOT NULL DEFAULT 0,
    "q1Actual" INTEGER NOT NULL DEFAULT 0,
    "q2Forecast" INTEGER NOT NULL DEFAULT 0,
    "q2Actual" INTEGER NOT NULL DEFAULT 0,
    "q3Forecast" INTEGER NOT NULL DEFAULT 0,
    "q3Actual" INTEGER NOT NULL DEFAULT 0,
    "q4Forecast" INTEGER NOT NULL DEFAULT 0,
    "q4Actual" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeadcountTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cost" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "organizationId" TEXT,
    "year" INTEGER NOT NULL,
    "type" "public"."CostType" NOT NULL,
    "q1Forecast" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q1Actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q2Forecast" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q2Actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q3Forecast" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q3Actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q4Forecast" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "q4Actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeadcountTracker_teamId_idx" ON "public"."HeadcountTracker"("teamId");

-- CreateIndex
CREATE INDEX "HeadcountTracker_organizationId_idx" ON "public"."HeadcountTracker"("organizationId");

-- CreateIndex
CREATE INDEX "HeadcountTracker_year_idx" ON "public"."HeadcountTracker"("year");

-- CreateIndex
CREATE INDEX "Cost_teamId_idx" ON "public"."Cost"("teamId");

-- CreateIndex
CREATE INDEX "Cost_organizationId_idx" ON "public"."Cost"("organizationId");

-- CreateIndex
CREATE INDEX "Cost_year_idx" ON "public"."Cost"("year");

-- AddForeignKey
ALTER TABLE "public"."HeadcountTracker" ADD CONSTRAINT "HeadcountTracker_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HeadcountTracker" ADD CONSTRAINT "HeadcountTracker_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cost" ADD CONSTRAINT "Cost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
