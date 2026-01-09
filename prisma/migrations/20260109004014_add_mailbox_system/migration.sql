-- CreateEnum
CREATE TYPE "AliasMode" AS ENUM ('forward', 'mailbox');

-- AlterTable
ALTER TABLE "aliases" ADD COLUMN     "mailboxId" TEXT,
ADD COLUMN     "mode" "AliasMode" NOT NULL DEFAULT 'forward',
ALTER COLUMN "forwardTo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "mailboxes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "emailAlias" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailbox_sessions" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mailbox_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_emailAlias_key" ON "mailboxes"("emailAlias");

-- CreateIndex
CREATE INDEX "mailboxes_userId_idx" ON "mailboxes"("userId");

-- CreateIndex
CREATE INDEX "mailboxes_domainId_idx" ON "mailboxes"("domainId");

-- CreateIndex
CREATE INDEX "mailbox_sessions_mailboxId_idx" ON "mailbox_sessions"("mailboxId");

-- CreateIndex
CREATE INDEX "mailbox_sessions_userId_idx" ON "mailbox_sessions"("userId");

-- CreateIndex
CREATE INDEX "aliases_mailboxId_idx" ON "aliases"("mailboxId");

-- AddForeignKey
ALTER TABLE "aliases" ADD CONSTRAINT "aliases_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailbox_sessions" ADD CONSTRAINT "mailbox_sessions_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailbox_sessions" ADD CONSTRAINT "mailbox_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
