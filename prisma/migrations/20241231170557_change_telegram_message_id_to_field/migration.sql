/*
  Warnings:

  - You are about to drop the column `metadata` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "metadata",
ADD COLUMN     "telegramMessageId" INTEGER;
