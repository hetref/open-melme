-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "mailboxId" TEXT;

-- CreateIndex
CREATE INDEX "email_logs_mailboxId_idx" ON "email_logs"("mailboxId");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
