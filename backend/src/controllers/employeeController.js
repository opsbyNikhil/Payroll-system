const prisma = require("../utils/prisma");

const createEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfJoining,
      dateOfBirth,
      panNumber,
      uanNumber,
      esiNumber,
      bankAccount,
      bankName,
      ifscCode,
      companyId,
    } = req.body;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        dateOfJoining: new Date(dateOfJoining),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        panNumber,
        uanNumber,
        esiNumber,
        bankAccount,
        bankName,
        ifscCode,
        companyId,
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create employee",
    });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        company: true,
      },
    });

    res.json(employees);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfJoining,
      dateOfBirth,
      panNumber,
      uanNumber,
      esiNumber,
      bankAccount,
      bankName,
      ifscCode,
      companyId,
    } = req.body;

    const employee = await prisma.employee.update({
      where: {
        id: Number(id),
      },
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        dateOfJoining: new Date(dateOfJoining),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        panNumber,
        uanNumber,
        esiNumber,
        bankAccount,
        bankName,
        ifscCode,
        companyId: Number(companyId),
      },
    });

    res.json(employee);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.employee.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "Cannot delete employee because salary or payroll records are associated with this employee.",
      });
    }

    res.status(500).json({
      message: "Failed to delete employee",
    });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.update({
      where: {
        id: Number(id),
      },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to deactivate employee",
    });
  }
};

const activateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.update({
      where: {
        id: Number(id),
      },
      data: {
        isActive: true,
      },
    });

    res.json({
      message: "Employee activated successfully",
      employee,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to activate employee",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
};