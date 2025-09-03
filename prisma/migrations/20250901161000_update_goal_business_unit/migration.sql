/*
  Warnings:

  - You are about to drop the column `orgId` on the `BusinessUnit` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Goal` table. All the data in the column will be lost.
  - Added the required column `businessUnitId` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quarter` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BusinessUnit" DROP CONSTRAINT "BusinessUnit_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Goal" DROP CONSTRAINT "Goal_stakeholderId_fkey";

-- AlterTable
ALTER TABLE "public"."BusinessUnit" DROP COLUMN "orgId",
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "public"."Goal" DROP COLUMN "endDate",
DROP COLUMN "requirements",
DROP COLUMN "startDate",
ADD COLUMN     "businessUnitId" TEXT NOT NULL,
ADD COLUMN     "quarter" "public"."Quarter" NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "stakeholderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Team" ADD COLUMN     "businessUnitId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."BusinessUnit" ADD CONSTRAINT "BusinessUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "public"."Stakeholder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
