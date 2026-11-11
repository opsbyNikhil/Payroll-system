
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const prisma = require("../src/utils/prisma");

const repairPayrollItems = async () => {
  try {
    const payrollIds = [3, 4];

    for (const payrollId of payrollIds) {
      const payroll = await prisma.payroll.findUnique({
        where: {
          id: payrollId,
        },
      });

      if (!payroll) {
        console.log(`Payroll ${payrollId} not found`);
        continue;
      }

      const existingItems = await prisma.payrollItem.findMany({
        where: {
          payrollId,
        },
      });

      if (existingItems.length > 0) {
        console.log(`Payroll ${payrollId} already has items. Skipping.`);
        continue;
      }

      const salaryStructure = await prisma.salaryStructure.findUnique({
        where: {
          employeeId: payroll.employeeId,
        },
      });

      if (!salaryStructure) {
        console.log(`Salary structure not found for payroll ${payrollId}`);
        continue;
      }

      await prisma.payrollItem.createMany({
        data: [
          {
            payrollId,
            name: "Basic Salary",
            type: "EARNING",
            amount: salaryStructure.basicSalary,
          },
          {
            payrollId,
            name: "HRA",
            type: "EARNING",
            amount: salaryStructure.hra,
          },
          {
            payrollId,
            name: "Conveyance Allowance",
            type: "EARNING",
            amount: salaryStructure.conveyance,
          },
          {
            payrollId,
            name: "Medical Allowance",
            type: "EARNING",
            amount: salaryStructure.medicalAllowance,
          },
          {
            payrollId,
            name: "Special Allowance",
            type: "EARNING",
            amount: salaryStructure.specialAllowance,
          },
          {
            payrollId,
            name: "Other Allowance",
            type: "EARNING",
            amount: salaryStructure.otherAllowance,
          },
        ],
      });

      console.log(`Payroll ${payrollId} repaired successfully`);
    }
  } catch (error) {
    console.error("Failed to repair payroll items:", error);
  } finally {
    await prisma.$disconnect();
  }
};

repairPayrollItems();
