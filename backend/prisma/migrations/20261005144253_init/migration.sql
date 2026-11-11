-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID');

-- CreateEnum
CREATE TYPE "PayrollItemType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "panNumber" TEXT,
    "uanNumber" TEXT,
    "esiNumber" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "ifscCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "payrollMonth" INTEGER NOT NULL,
    "payrollYear" INTEGER NOT NULL,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" SERIAL NOT NULL,
    "payrollId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PayrollItemType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" SERIAL NOT NULL,
    "payrollId" INTEGER NOT NULL,
    "pdfPath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_employeeId_key" ON "SalaryStructure"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_employeeId_payrollMonth_payrollYear_key" ON "Payroll"("employeeId", "payrollMonth", "payrollYear");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrollId_key" ON "Payslip"("payrollId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
