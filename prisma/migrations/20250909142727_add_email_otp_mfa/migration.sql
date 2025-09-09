-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "mfaEnforced" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);
