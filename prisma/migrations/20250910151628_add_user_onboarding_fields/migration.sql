-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "leadershipStyles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "level" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);
