/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `email_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "inReplyTo" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "references" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_messageId_key" ON "email_logs"("messageId");

-- CreateIndex
CREATE INDEX "email_logs_conversationId_idx" ON "email_logs"("conversationId");
