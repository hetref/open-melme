-- AlterTable: Add new columns with defaults
ALTER TABLE "domains" ADD COLUMN "rootDomain" TEXT NOT NULL DEFAULT '';
ALTER TABLE "domains" ADD COLUMN "subdomain" TEXT;
ALTER TABLE "domains" ADD COLUMN "fullDomain" TEXT NOT NULL DEFAULT '';

-- Migrate existing data: copy domain to both rootDomain and fullDomain
UPDATE "domains" SET "rootDomain" = "domain", "fullDomain" = "domain" WHERE "domain" IS NOT NULL;

-- DropIndex: Remove old unique constraint
DROP INDEX IF EXISTS "domains_userId_domain_key";

-- CreateIndex: Add new unique constraint
CREATE UNIQUE INDEX "domains_userId_fullDomain_key" ON "domains"("userId", "fullDomain");
