-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultModelId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultModelId_fkey" FOREIGN KEY ("defaultModelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
