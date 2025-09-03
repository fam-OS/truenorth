/*
  Migration to add CompanyAccount model and migrate existing Organization data
*/

-- First, create the CompanyAccount table
CREATE TABLE "public"."CompanyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "founderId" TEXT,
    "employees" TEXT,
    "headquarters" TEXT,
    "launchedDate" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "tradedAs" TEXT,
    "corporateIntranet" TEXT,
    "glassdoorLink" TEXT,
    "linkedinLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAccount_pkey" PRIMARY KEY ("id")
);

-- Create indexes and constraints for CompanyAccount
CREATE UNIQUE INDEX "CompanyAccount_userId_key" ON "public"."CompanyAccount"("userId");

-- Add foreign key constraints for CompanyAccount
ALTER TABLE "public"."CompanyAccount" ADD CONSTRAINT "CompanyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CompanyAccount" ADD CONSTRAINT "CompanyAccount_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing Organization data to CompanyAccount
-- For each user that has organizations, create a company account with the first organization's data
INSERT INTO "public"."CompanyAccount" ("id", "userId", "name", "description", "founderId", "employees", "headquarters", "launchedDate", "isPrivate", "tradedAs", "corporateIntranet", "glassdoorLink", "linkedinLink", "createdAt", "updatedAt")
SELECT 
    'ca_' || "User"."id" as "id",
    "User"."id" as "userId",
    COALESCE("Organization"."name", 'My Company') as "name",
    "Organization"."description",
    "Organization"."founderId",
    "Organization"."employees",
    "Organization"."headquarters", 
    "Organization"."launchedDate",
    COALESCE("Organization"."isPrivate", true) as "isPrivate",
    "Organization"."tradedAs",
    "Organization"."corporateIntranet",
    "Organization"."glassdoorLink",
    "Organization"."linkedinLink",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "public"."User"
LEFT JOIN "public"."Organization" ON "Organization"."id" = (
    SELECT "org"."id" 
    FROM "public"."Organization" "org"
    JOIN "public"."_OrganizationToUser" "otu" ON "otu"."A" = "org"."id"
    WHERE "otu"."B" = "User"."id"
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM "public"."_OrganizationToUser" "otu2" 
    WHERE "otu2"."B" = "User"."id"
);

-- Drop the old foreign key constraint
ALTER TABLE "public"."Organization" DROP CONSTRAINT IF EXISTS "Organization_founderId_fkey";

-- Add the companyAccountId column with a default value first
ALTER TABLE "public"."Organization" ADD COLUMN "companyAccountId" TEXT;

-- Update existing organizations to reference their user's company account
UPDATE "public"."Organization" 
SET "companyAccountId" = 'ca_' || "User"."id"
FROM "public"."User"
JOIN "public"."_OrganizationToUser" "otu" ON "otu"."B" = "User"."id"
WHERE "otu"."A" = "Organization"."id";

-- Make companyAccountId NOT NULL after setting values
ALTER TABLE "public"."Organization" ALTER COLUMN "companyAccountId" SET NOT NULL;

-- Remove the old company-level columns from Organization
ALTER TABLE "public"."Organization" 
DROP COLUMN "corporateIntranet",
DROP COLUMN "employees",
DROP COLUMN "founderId",
DROP COLUMN "glassdoorLink",
DROP COLUMN "headquarters",
DROP COLUMN "isPrivate",
DROP COLUMN "launchedDate",
DROP COLUMN "linkedinLink",
DROP COLUMN "tradedAs";

-- Add foreign key constraint for Organization -> CompanyAccount
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_companyAccountId_fkey" FOREIGN KEY ("companyAccountId") REFERENCES "public"."CompanyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
