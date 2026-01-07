-- AlterTable
ALTER TABLE "domains" ADD COLUMN     "dkimStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "dnsRecords" TEXT,
ADD COLUMN     "mxStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "verificationError" TEXT;
