const express = require("express");
const {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.patch("/:id/deactivate", deactivateEmployee);
router.patch("/:id/activate", activateEmployee);
module.exports = router;
