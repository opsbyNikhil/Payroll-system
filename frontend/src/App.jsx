import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Employees from "./pages/Employees";
import SalaryStructures from "./pages/SalaryStructures";
import Payroll from "./pages/Payroll";
import Payslips from "./pages/Payslips";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/salary-structures" element={<SalaryStructures />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payslips" element={<Payslips />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
