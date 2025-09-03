-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "corporateIntranet" TEXT,
ADD COLUMN     "employees" TEXT,
ADD COLUMN     "founderId" TEXT,
ADD COLUMN     "glassdoorLink" TEXT,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "launchedDate" TEXT,
ADD COLUMN     "linkedinLink" TEXT,
ADD COLUMN     "tradedAs" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
