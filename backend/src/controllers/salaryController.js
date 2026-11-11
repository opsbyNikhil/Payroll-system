const prisma = require("../utils/prisma");

const createSalaryStructure = async (req, res) => {
  try {
    const {
      employeeId,
      basicSalary,
      hra,
      conveyance,
      medicalAllowance,
      specialAllowance,
      otherAllowance,
    } = req.body;

    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        employeeId: Number(employeeId),
        basicSalary,
        hra: hra || 0,
        conveyance: conveyance || 0,
        medicalAllowance: medicalAllowance || 0,
        specialAllowance: specialAllowance || 0,
        otherAllowance: otherAllowance || 0,
      },
    });

    res.status(201).json(salaryStructure);
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Salary structure already exists for this employee.",
      });
    }

    res.status(500).json({
      message: "Failed to create salary structure",
    });
  }
};

const getSalaryStructures = async (req, res) => {
  try {
    const salaryStructures =
      await prisma.salaryStructure.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          employee: true,
        },
      });

    res.json(salaryStructures);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch salary structures",
    });
  }
};

const updateSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      basicSalary,
      hra,
      conveyance,
      medicalAllowance,
      specialAllowance,
      otherAllowance,
    } = req.body;

    const salaryStructure =
      await prisma.salaryStructure.update({
        where: {
          id: Number(id),
        },
        data: {
          basicSalary,
          hra: hra || 0,
          conveyance: conveyance || 0,
          medicalAllowance: medicalAllowance || 0,
          specialAllowance: specialAllowance || 0,
          otherAllowance: otherAllowance || 0,
        },
      });

    res.json(salaryStructure);
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Salary structure not found.",
      });
    }

    res.status(500).json({
      message: "Failed to update salary structure",
    });
  }
};


const deleteSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryStructure =
      await prisma.salaryStructure.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!salaryStructure) {
      return res.status(404).json({
        message: "Salary structure not found.",
      });
    }

    const payrollExists = await prisma.payroll.findFirst({
      where: {
        employeeId: salaryStructure.employeeId,
      },
    });

    if (payrollExists) {
      return res.status(409).json({
        message:
          "Cannot delete salary structure because payroll records exist for this employee.",
      });
    }

    await prisma.salaryStructure.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      message: "Salary structure deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete salary structure",
    });
  }
};

module.exports = {
  createSalaryStructure,
  getSalaryStructures,
  updateSalaryStructure,
  deleteSalaryStructure
};
