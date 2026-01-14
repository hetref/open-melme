/*
  Warnings:

  - You are about to drop the column `mailboxId` on the `email_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "email_logs" DROP CONSTRAINT "email_logs_mailboxId_fkey";

-- DropIndex
DROP INDEX "email_logs_mailboxId_idx";

-- AlterTable
ALTER TABLE "email_logs" DROP COLUMN "mailboxId";
