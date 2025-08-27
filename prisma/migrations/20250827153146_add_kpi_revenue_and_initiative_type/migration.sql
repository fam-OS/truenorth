-- CreateEnum
CREATE TYPE "public"."InitiativeType" AS ENUM ('CAPITALIZABLE', 'OPERATIONAL_EFFICIENCY', 'KTLO');

-- AlterTable
ALTER TABLE "public"."Initiative" ADD COLUMN     "type" "public"."InitiativeType";

-- AlterTable
ALTER TABLE "public"."Kpi" ADD COLUMN     "actualRevenue" DOUBLE PRECISION,
ADD COLUMN     "forecastedRevenue" DOUBLE PRECISION;
