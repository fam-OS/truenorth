/*
  Warnings:

  - You are about to drop the column `status` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Goal" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."GoalStatus";
