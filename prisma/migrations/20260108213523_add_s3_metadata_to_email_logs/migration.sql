/*
  Warnings:

  - A unique constraint covering the columns `[s3Key]` on the table `email_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "s3Bucket" TEXT,
ADD COLUMN     "s3Key" TEXT,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "subject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_s3Key_key" ON "email_logs"("s3Key");

-- CreateIndex
CREATE INDEX "email_logs_s3Key_idx" ON "email_logs"("s3Key");
