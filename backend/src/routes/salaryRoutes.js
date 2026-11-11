const express = require("express");

const {
  createSalaryStructure,
  getSalaryStructures,
  updateSalaryStructure,
  deleteSalaryStructure,
} = require("../controllers/salaryController");

const router = express.Router();

router.get("/", getSalaryStructures);
router.post("/", createSalaryStructure);
router.put("/:id", updateSalaryStructure);
router.delete("/:id", deleteSalaryStructure);

module.exports = router;
