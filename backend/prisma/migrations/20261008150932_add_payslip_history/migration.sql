-- CreateTable
CREATE TABLE "PayslipHistory" (
    "id" SERIAL NOT NULL,
    "payslipId" INTEGER NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PayslipHistory" ADD CONSTRAINT "PayslipHistory_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
