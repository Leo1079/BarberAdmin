-- AlterTable
ALTER TABLE "Adjustment" ADD COLUMN     "payoutId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "shopName" SET DEFAULT 'Tucson Barber';

-- CreateIndex
CREATE INDEX "Adjustment_payoutId_idx" ON "Adjustment"("payoutId");

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
