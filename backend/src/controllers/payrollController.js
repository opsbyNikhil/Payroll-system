const prisma = require("../utils/prisma");

const createPayroll = async (req, res) => {
  try {
    const { employeeId, companyId, payrollMonth, payrollYear } = req.body;

    const salaryStructure = await prisma.salaryStructure.findUnique({
      where: {
        employeeId,
      },
    });

    if (!salaryStructure) {
      return res.status(404).json({
        message: "Salary structure not found for employee",
      });
    }

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        companyId,
        payrollMonth,
        payrollYear,
        grossSalary: 0,
        totalDeductions: 0,
        netSalary: 0,
        status: "DRAFT",
      },
    });

    await prisma.payrollItem.createMany({
      data: [
        {
          payrollId: payroll.id,
          name: "Basic Salary",
          type: "EARNING",
          amount: salaryStructure.basicSalary,
        },
        {
          payrollId: payroll.id,
          name: "HRA",
          type: "EARNING",
          amount: salaryStructure.hra,
        },
        {
          payrollId: payroll.id,
          name: "Conveyance Allowance",
          type: "EARNING",
          amount: salaryStructure.conveyance,
        },
        {
          payrollId: payroll.id,
          name: "Medical Allowance",
          type: "EARNING",
          amount: salaryStructure.medicalAllowance,
        },
        {
          payrollId: payroll.id,
          name: "Special Allowance",
          type: "EARNING",
          amount: salaryStructure.specialAllowance,
        },
        {
          payrollId: payroll.id,
          name: "Other Allowance",
          type: "EARNING",
          amount: salaryStructure.otherAllowance,
        },        
        {
          payrollId: payroll.id,
          name: "PF",
          type: "DEDUCTION",
          amount: 3600,
        },
        {
          payrollId: payroll.id,
          name: "TDS",
          type: "DEDUCTION",
          amount: 1000,
        },

      ],
    });

    const grossSalary =
      Number(salaryStructure.basicSalary) +
      Number(salaryStructure.hra) +
      Number(salaryStructure.conveyance) +
      Number(salaryStructure.medicalAllowance) +
      Number(salaryStructure.specialAllowance) +
      Number(salaryStructure.otherAllowance);

    const totalDeductions = 3600 + 1000;
    const netSalary = grossSalary - totalDeductions;

    const updatedPayroll = await prisma.payroll.update({
      where: {
        id: payroll.id,
      },
      data: {
        grossSalary,
        totalDeductions,
        netSalary,
      },
    });

    res.status(201).json(updatedPayroll);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create payroll",
    });
  }
};

const getPayrolls = async (req, res) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        employee: true,
        company: true,
        items: true,
      },
    });

    res.json(payrolls);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch payrolls",
    });
  }
};

const addPayrollItem = async (req, res) => {
  try {
    const { payrollId, name, type, amount } = req.body;

    const payrollItem = await prisma.payrollItem.create({
      data: {
        payrollId,
        name,
        type,
        amount,
      },
    });

    res.status(201).json(payrollItem);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add payroll item",
    });
  }
};

const recalculatePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const items = await prisma.payrollItem.findMany({
      where: {
        payrollId: Number(payrollId),
      },
    });

    const grossSalary = items
      .filter((item) => item.type === "EARNING")
      .reduce((total, item) => total + Number(item.amount), 0);

    const totalDeductions = items
      .filter((item) => item.type === "DEDUCTION")
      .reduce((total, item) => total + Number(item.amount), 0);

    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.update({
      where: {
        id: Number(payrollId),
      },
      data: {
        grossSalary,
        totalDeductions,
        netSalary,
      },
    });

    res.json(payroll);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to recalculate payroll",
    });
  }
};

const processPayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await prisma.payroll.update({
      where: {
        id: Number(payrollId),
      },
      data: {
        status: "PROCESSED",
      },
    });

    res.json(payroll);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to process payroll",
    });
  }
};

const markPayrollPaid = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await prisma.payroll.update({
      where: {
        id: Number(payrollId),
      },
      data: {
        status: "PAID",
      },
    });

    res.json(payroll);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to mark payroll as paid",
    });
  }
};

const deletePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await prisma.payroll.findUnique({
      where: {
        id: Number(payrollId),
      },
    });

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    if (payroll.status === "PAID") {
      return res.status(400).json({
        message: "Paid payroll cannot be deleted",
      });
    }

    await prisma.payroll.delete({
      where: {
        id: Number(payrollId),
      },
    });

    res.json({
      message: "Payroll deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete payroll",
    });
  }
};


module.exports = {
  createPayroll,
  getPayrolls,
  addPayrollItem,
  recalculatePayroll,
  processPayroll,
  markPayrollPaid,
  deletePayroll,
};
