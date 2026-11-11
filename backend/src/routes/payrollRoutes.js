const express = require("express");

const {
  createPayroll,
  getPayrolls,
  addPayrollItem,
  recalculatePayroll,
  processPayroll,
  markPayrollPaid,
  deletePayroll,
} = require("../controllers/payrollController");

const {
  generatePayslip,
  checkPayslip,
  getPayslipHistory,
  viewPayslipPdf,
} = require("../controllers/payslipController");

const router = express.Router();

router.get("/", getPayrolls);
router.post("/", createPayroll);
router.post("/items", addPayrollItem);
router.put("/:payrollId/recalculate", recalculatePayroll);
router.put("/:payrollId/process", processPayroll);
router.put("/:payrollId/pay", markPayrollPaid);
router.get("/payslips/history", getPayslipHistory);
router.get("/:payrollId/payslip", checkPayslip);
router.post("/:payrollId/payslip", generatePayslip);
router.delete("/:payrollId", deletePayroll);
router.get("/payslips/history/:historyId/pdf", viewPayslipPdf);

module.exports = router;
