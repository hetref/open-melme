-- CreateEnum
CREATE TYPE "AttachmentsStatus" AS ENUM ('not_processed', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "attachmentsError" TEXT,
ADD COLUMN     "attachmentsStatus" "AttachmentsStatus" NOT NULL DEFAULT 'not_processed';

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" TEXT NOT NULL,
    "emailLogId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_attachments_s3Key_key" ON "email_attachments"("s3Key");

-- CreateIndex
CREATE INDEX "email_attachments_emailLogId_idx" ON "email_attachments"("emailLogId");

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "email_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
