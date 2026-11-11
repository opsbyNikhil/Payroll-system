require("dotenv").config();
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const companyRoutes = require("./routes/companyRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "payroll-backend",
  });
});

const PORT = process.env.PORT || 5000;
app.use("/api/health", healthRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Payroll backend running on port ${PORT}`);
});
