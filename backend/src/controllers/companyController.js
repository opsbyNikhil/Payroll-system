const prisma = require("../utils/prisma");

const createCompany = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create company",
    });
  }
};



const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(companies);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const company = await prisma.company.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.json(company);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update company",
    });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "Cannot delete company because employees are associated with it.",
      });
    }

    res.status(500).json({
      message: "Failed to delete company",
    });
  }
};


module.exports = {
  createCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
};