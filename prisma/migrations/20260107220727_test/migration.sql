/*
  Warnings:

  - The values [cancelled] on the enum `DomainVerificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DomainVerificationStatus_new" AS ENUM ('pending', 'verified', 'failed');
ALTER TABLE "public"."domains" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "domains" ALTER COLUMN "verificationStatus" TYPE "DomainVerificationStatus_new" USING ("verificationStatus"::text::"DomainVerificationStatus_new");
ALTER TYPE "DomainVerificationStatus" RENAME TO "DomainVerificationStatus_old";
ALTER TYPE "DomainVerificationStatus_new" RENAME TO "DomainVerificationStatus";
DROP TYPE "public"."DomainVerificationStatus_old";
ALTER TABLE "domains" ALTER COLUMN "verificationStatus" SET DEFAULT 'pending';
COMMIT;
