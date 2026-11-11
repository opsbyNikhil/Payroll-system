import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Row,
  Col,
  Segmented,
  Select,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  BankOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TableOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

import api from "../services/api";

const { Title, Text } = Typography;

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const BRAND = "#0F766E"; // UI accent (tiles, buttons) - keep in sync with other pages
const BRAND_TINT = "#E6F4F2";

// Chart colors. Validated categorical palette (colorblind-safe, 3 slots,
// light and dark). Series colors are kept separate from the brand teal on
// purpose: teal fails the chroma floor for data colors.
const CHART = {
  light: {
    surface: "#ffffff",
    ink: "#0b0b0b",
    inkSecondary: "#52514e",
    muted: "#898781",
    grid: "#e1e0d9",
    baseline: "#c3c2b7",
    series: ["#2a78d6", "#eb6834", "#1baf7a"],
  },
  dark: {
    surface: "#141414",
    ink: "#ffffff",
    inkSecondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
    series: ["#3987e5", "#d95926", "#199e70"],
  },
};

const isDarkColor = (hex) => {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r + g + b) / 3 < 110;
};

const STATUS_ORDER = ["DRAFT", "PROCESSED", "PAID"];
const STATUS_LABELS = { DRAFT: "Draft", PROCESSED: "Processed", PAID: "Paid" };
const STATUS_TAG_COLORS = { DRAFT: "orange", PROCESSED: "blue", PAID: "green" };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactINR = (value) => {
  const n = Math.abs(Number(value) || 0);
  const sign = value < 0 ? "-" : "";
  if (n >= 1e7) return `${sign}₹${+(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${sign}₹${+(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${sign}₹${+(n / 1e3).toFixed(1)}K`;
  return `${sign}₹${n}`;
};

const monthKey = (p) =>
  `${p.payrollYear}-${String(p.payrollMonth).padStart(2, "0")}`;

const monthLabelLong = (p) =>
  dayjs(new Date(Number(p.payrollYear), Number(p.payrollMonth) - 1, 1)).format(
    "MMMM YYYY",
  );

const employeeName = (employee) =>
  employee ? `${employee.firstName} ${employee.lastName}` : "-";

const companyIdOf = (payroll) => payroll.company?.id ?? payroll.companyId;

const sum = (items, pick) =>
  items.reduce((total, item) => total + (Number(pick(item)) || 0), 0);

const tabular = { fontVariantNumeric: "tabular-nums" };

// Turn report field definitions into antd columns.
const toColumns = (fields) =>
  fields.map((field) => ({
    title: field.title,
    dataIndex: field.key,
    key: field.key,
    align: field.type === "text" ? undefined : "right",
    render:
      field.type === "money"
        ? (v) => <span style={tabular}>{formatINR(v)}</span>
        : field.type === "number"
          ? (v) => <span style={tabular}>{v}</span>
          : undefined,
  }));

const downloadCsv = (filename, fields, rows) => {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [
    fields.map((f) => escape(f.title)).join(","),
    ...rows.map((row) => fields.map((f) => escape(row[f.key])).join(",")),
  ];

  // BOM so Excel opens UTF-8 (₹, names) correctly
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatTile({ label, value, hint, icon }) {
  const { token } = theme.useToken();

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 20 } }}
      style={{
        height: "100%",
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
            {label}
          </Text>
          <div
            style={{
              marginTop: 6,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: token.colorText,
              overflowWrap: "anywhere",
            }}
          >
            {value}
          </div>
          {hint && (
            <Text
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 12,
                color: token.colorTextSecondary,
              }}
            >
              {hint}
            </Text>
          )}
        </div>

        <div
          aria-hidden="true"
          style={{
            flex: "none",
            width: 40,
            height: 40,
            borderRadius: 12,
            background: BRAND_TINT,
            color: BRAND,
            display: "grid",
            placeItems: "center",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label, c, formatValue }) {
  if (!active || !payload || payload.length === 0) return null;

  const heading = label ?? payload[0]?.name;

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.grid}`,
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
        minWidth: 140,
      }}
    >
      <div
        style={{ color: c.ink, fontWeight: 600, fontSize: 13, marginBottom: 4 }}
      >
        {heading}
      </div>
      {payload.map((entry, index) => (
        <div
          key={`${entry.name}-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: c.inkSecondary,
            lineHeight: 1.7,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              flex: "none",
              background: entry.color || entry.payload?.fill || entry.stroke,
            }}
          />
          <span style={{ flex: 1 }}>{entry.name}</span>
          <span style={{ color: c.ink, fontWeight: 600, ...tabular }}>
            {formatValue ? formatValue(entry.value, entry) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendKeys({ items, c }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: c.inkSecondary,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              background: item.color,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// Card with a chart/table switch. The table is the accessible twin of the chart.
function ChartCard({
  title,
  subtitle,
  legend,
  ariaLabel,
  columns,
  data,
  isEmpty,
  emptyText,
  children,
}) {
  const { token } = theme.useToken();
  const [view, setView] = useState("chart");

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 20 } }}
      style={{
        height: "100%",
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15 }}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                display: "block",
                fontSize: 12,
                color: token.colorTextSecondary,
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>

        {!isEmpty && (
          <Segmented
            size="small"
            aria-label={`${title} view`}
            value={view}
            onChange={setView}
            options={[
              {
                value: "chart",
                icon: <BarChartOutlined />,
                title: "Chart view",
              },
              { value: "table", icon: <TableOutlined />, title: "Table view" },
            ]}
          />
        )}
      </div>

      {view === "chart" && !isEmpty && legend}

      <div style={{ marginTop: 12 }}>
        {isEmpty ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={emptyText}
            style={{ padding: "32px 0" }}
          />
        ) : view === "chart" ? (
          <div role="img" aria-label={ariaLabel}>
            {children}
          </div>
        ) : (
          <Table
            size="small"
            rowKey="key"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: "max-content", y: 260 }}
          />
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();

  const c = isDarkColor(token.colorBgContainer) ? CHART.dark : CHART.light;
  const [s1, s2, s3] = c.series;

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [range, setRange] = useState("12m");
  const [companyFilter, setCompanyFilter] = useState(null);
  const [reportTab, setReportTab] = useState("monthly");

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      api.get("/payroll"),
      api.get("/employees"),
      api.get("/companies"),
      api.get("/payroll/payslips/history"),
    ]);

    const [payrollRes, employeeRes, companyRes, payslipRes] = results;

    if (payrollRes.status === "fulfilled")
      setPayrolls(payrollRes.value.data || []);
    if (employeeRes.status === "fulfilled")
      setEmployees(employeeRes.value.data || []);
    if (companyRes.status === "fulfilled")
      setCompanies(companyRes.value.data || []);
    if (payslipRes.status === "fulfilled")
      setPayslips(payslipRes.value.data || []);

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      failed.forEach((r) =>
        console.error("Dashboard request failed:", r.reason),
      );
      message.error("Some dashboard data could not be loaded");
    }

    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- filters ---------- */

  const rangeOptions = useMemo(() => {
    const years = [...new Set(payrolls.map((p) => Number(p.payrollYear)))]
      .filter(Boolean)
      .sort((a, b) => b - a);

    return [
      { value: "12m", label: "Last 12 months" },
      ...years.map((year) => ({ value: String(year), label: String(year) })),
    ];
  }, [payrolls]);

  const months = useMemo(() => {
    if (range === "12m") {
      const start = dayjs().startOf("month").subtract(11, "month");
      return Array.from({ length: 12 }, (_, i) => start.add(i, "month"));
    }
    return Array.from({ length: 12 }, (_, i) =>
      dayjs(new Date(Number(range), i, 1)),
    );
  }, [range]);

  const periodLabel =
    range === "12m" ? "last 12 months" : `calendar year ${range}`;

  const slice = useMemo(() => {
    const keys = new Set(months.map((m) => m.format("YYYY-MM")));

    return payrolls.filter(
      (p) =>
        keys.has(monthKey(p)) &&
        (!companyFilter || companyIdOf(p) === companyFilter),
    );
  }, [payrolls, months, companyFilter]);

  const scopedEmployees = useMemo(
    () =>
      employees.filter((e) => !companyFilter || e.companyId === companyFilter),
    [employees, companyFilter],
  );

  const scopedCompanies = useMemo(
    () => companies.filter((co) => !companyFilter || co.id === companyFilter),
    [companies, companyFilter],
  );

  /* ---------- aggregates ---------- */

  const monthly = useMemo(
    () =>
      months.map((m) => {
        const key = m.format("YYYY-MM");
        const rows = slice.filter((p) => monthKey(p) === key);

        return {
          key,
          label: m.format("MMM 'YY"),
          longLabel: m.format("MMMM YYYY"),
          payrolls: rows.length,
          gross: sum(rows, (p) => p.grossSalary),
          deductions: sum(rows, (p) => p.totalDeductions),
          net: sum(rows, (p) => p.netSalary),
          paid: rows.filter((p) => p.status === "PAID").length,
          pending: rows.filter((p) => p.status !== "PAID").length,
        };
      }),
    [months, slice],
  );

  const statusData = useMemo(
    () =>
      STATUS_ORDER.map((status, index) => {
        const rows = slice.filter((p) => p.status === status);

        return {
          key: status,
          name: STATUS_LABELS[status],
          value: rows.length,
          net: sum(rows, (p) => p.netSalary),
          color: c.series[index],
        };
      }),
    [slice, c],
  );

  const totalPayrolls = slice.length;
  const netTotal = sum(slice, (p) => p.netSalary);
  const grossTotal = sum(slice, (p) => p.grossSalary);
  const pendingRows = slice.filter((p) => p.status !== "PAID");
  const activeEmployees = scopedEmployees.filter((e) => e.isActive).length;

  // Bar chart: employees per company, or net payroll per employee when
  // there is only one company in scope (a one-bar chart says nothing).
  const barMode =
    companyFilter || companies.length < 2 ? "employee" : "company";

  const barRows = useMemo(() => {
    if (barMode === "company") {
      return companies
        .map((co) => ({
          key: String(co.id),
          name: co.name,
          value: employees.filter((e) => e.companyId === co.id && e.isActive)
            .length,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }

    const byEmployee = new Map();
    slice.forEach((p) => {
      const id = p.employee?.id ?? p.employeeId;
      const entry = byEmployee.get(id) || {
        key: String(id),
        name: employeeName(p.employee),
        value: 0,
      };
      entry.value += Number(p.netSalary) || 0;
      byEmployee.set(id, entry);
    });

    return [...byEmployee.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [barMode, companies, employees, slice]);

  /* ---------- reports ---------- */

  const reports = useMemo(() => {
    const monthlyRows = monthly
      .filter((m) => m.payrolls > 0)
      .slice()
      .reverse()
      .map((m) => ({
        key: m.key,
        month: m.longLabel,
        payrolls: m.payrolls,
        gross: m.gross,
        deductions: m.deductions,
        net: m.net,
        paid: m.paid,
        pending: m.pending,
      }));

    const companyRows = scopedCompanies
      .map((co) => {
        const rows = slice.filter((p) => companyIdOf(p) === co.id);

        return {
          key: String(co.id),
          company: co.name,
          employees: employees.filter(
            (e) => e.companyId === co.id && e.isActive,
          ).length,
          payrolls: rows.length,
          gross: sum(rows, (p) => p.grossSalary),
          deductions: sum(rows, (p) => p.totalDeductions),
          net: sum(rows, (p) => p.netSalary),
        };
      })
      .sort((a, b) => b.net - a.net);

    const byEmployee = new Map();
    slice.forEach((p) => {
      const id = p.employee?.id ?? p.employeeId;
      const entry = byEmployee.get(id) || {
        key: String(id),
        employee: p.employee
          ? `${p.employee.employeeCode} - ${employeeName(p.employee)}`
          : "-",
        company: p.company?.name || "-",
        payrolls: 0,
        gross: 0,
        net: 0,
        latest: "",
        latestKey: "",
      };
      entry.payrolls += 1;
      entry.gross += Number(p.grossSalary) || 0;
      entry.net += Number(p.netSalary) || 0;
      if (monthKey(p) > entry.latestKey) {
        entry.latestKey = monthKey(p);
        entry.latest = monthLabelLong(p);
      }
      byEmployee.set(id, entry);
    });
    const employeeRows = [...byEmployee.values()].sort((a, b) => b.net - a.net);

    return {
      monthly: {
        label: "Monthly summary",
        rows: monthlyRows,
        totals: true,
        fields: [
          { key: "month", title: "Month", type: "text" },
          { key: "payrolls", title: "Payrolls", type: "number", sum: true },
          { key: "gross", title: "Gross salary", type: "money", sum: true },
          { key: "deductions", title: "Deductions", type: "money", sum: true },
          { key: "net", title: "Net salary", type: "money", sum: true },
          { key: "paid", title: "Paid", type: "number", sum: true },
          { key: "pending", title: "Pending", type: "number", sum: true },
        ],
      },
      company: {
        label: "By company",
        rows: companyRows,
        totals: true,
        fields: [
          { key: "company", title: "Company", type: "text" },
          {
            key: "employees",
            title: "Active employees",
            type: "number",
            sum: true,
          },
          { key: "payrolls", title: "Payrolls", type: "number", sum: true },
          { key: "gross", title: "Gross salary", type: "money", sum: true },
          { key: "deductions", title: "Deductions", type: "money", sum: true },
          { key: "net", title: "Net salary", type: "money", sum: true },
        ],
      },
      employee: {
        label: "By employee",
        rows: employeeRows,
        totals: true,
        fields: [
          { key: "employee", title: "Employee", type: "text" },
          { key: "company", title: "Company", type: "text" },
          { key: "payrolls", title: "Payrolls", type: "number", sum: true },
          { key: "gross", title: "Gross salary", type: "money", sum: true },
          { key: "net", title: "Net salary", type: "money", sum: true },
          { key: "latest", title: "Latest month", type: "text" },
        ],
      },
    };
  }, [monthly, scopedCompanies, slice, employees]);

  const activeReport = reports[reportTab];

  const handleExport = () => {
    if (activeReport.rows.length === 0) {
      message.info("There is nothing to export for this period");
      return;
    }

    downloadCsv(
      `payroll-report-${reportTab}-${dayjs().format("YYYY-MM-DD")}.csv`,
      activeReport.fields,
      activeReport.rows,
    );

    message.success("Report exported");
  };

  const recentRows = useMemo(
    () =>
      [...slice]
        .sort(
          (a, b) =>
            monthKey(b).localeCompare(monthKey(a)) ||
            (Number(b.id) || 0) - (Number(a.id) || 0),
        )
        .slice(0, 5),
    [slice],
  );

  /* ---------- chart pieces ---------- */

  const axisTick = { fill: c.muted, fontSize: 12 };
  const lastIndex = monthly.length - 1;

  // Marker only on the final point (end-dot with a surface ring)
  const endDot = (color) => (props) => {
    const { cx, cy, index } = props;

    if (index !== lastIndex || cx == null || cy == null) {
      return <g key={`dot-${index}`} />;
    }

    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke={c.surface}
        strokeWidth={2}
      />
    );
  };

  const trendColumns = toColumns([
    { key: "longLabel", title: "Month", type: "text" },
    { key: "gross", title: "Gross salary", type: "money" },
    { key: "deductions", title: "Deductions", type: "money" },
    { key: "net", title: "Net salary", type: "money" },
  ]);

  const statusColumns = toColumns([
    { key: "name", title: "Status", type: "text" },
    { key: "value", title: "Payrolls", type: "number" },
    { key: "net", title: "Net salary", type: "money" },
  ]);

  const barColumns = toColumns([
    {
      key: "name",
      title: barMode === "company" ? "Company" : "Employee",
      type: "text",
    },
    {
      key: "value",
      title: barMode === "company" ? "Active employees" : "Net salary",
      type: barMode === "company" ? "number" : "money",
    },
  ]);

  const barHeight = Math.max(180, barRows.length * 36 + 24);
  const truncate = (text) =>
    text.length > 16 ? `${text.slice(0, 15)}…` : text;

  const statusPieData = statusData.filter((s) => s.value > 0);

  const reportColumns = toColumns(activeReport.fields);

  /* ---------- render ---------- */

  return (
    <div style={{ width: "100%" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, letterSpacing: "-0.02em" }}>
          Dashboard
        </Title>
        <Text style={{ color: token.colorTextSecondary }}>
          Overview of your payroll management system.
        </Text>
      </div>

      {/* One filter row for everything below */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Select
          aria-label="Period"
          value={range}
          onChange={setRange}
          options={rangeOptions}
          style={{ width: 170 }}
        />

        <Select
          aria-label="Company"
          allowClear
          placeholder="All companies"
          value={companyFilter}
          onChange={setCompanyFilter}
          options={companies.map((co) => ({ value: co.id, label: co.name }))}
          style={{ width: 200 }}
        />

        <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Hold the previous render (reduced opacity) while refetching */}
      <div
        style={{
          opacity: loading ? 0.55 : 1,
          transition: "opacity 150ms ease",
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        {/* Stat tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16,
          }}
        >
          <StatTile
            label="Companies"
            value={scopedCompanies.length}
            hint={companyFilter ? "Selected company" : "In your system"}
            icon={<BankOutlined />}
          />
          <StatTile
            label="Active employees"
            value={activeEmployees}
            hint={`${scopedEmployees.length} in total`}
            icon={<TeamOutlined />}
          />
          <StatTile
            label="Net payroll"
            value={formatINR(netTotal)}
            hint={`Gross ${formatINR(grossTotal)} · ${periodLabel}`}
            icon={<WalletOutlined />}
          />
          <StatTile
            label="Awaiting payment"
            value={pendingRows.length}
            hint={
              pendingRows.length > 0
                ? `${formatINR(sum(pendingRows, (p) => p.netSalary))} not yet paid`
                : "Everything is paid"
            }
            icon={<ClockCircleOutlined />}
          />
          <StatTile
            label="Payslips generated"
            value={payslips.length}
            hint="All time"
            icon={<FileTextOutlined />}
          />
        </div>

        {/* Charts, row 1 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={16}>
            <ChartCard
              title="Payroll trend"
              subtitle={`Gross and net salary per month · ${periodLabel}, all statuses`}
              legend={
                <LegendKeys
                  c={c}
                  items={[
                    { label: "Gross salary", color: s1 },
                    { label: "Net salary", color: s2 },
                  ]}
                />
              }
              ariaLabel={`Line chart of gross and net salary per month, ${periodLabel}. Switch to table view for the numbers.`}
              columns={trendColumns}
              data={monthly}
              isEmpty={slice.length === 0}
              emptyText="No payroll in this period."
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={monthly}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: c.baseline }}
                    tick={axisTick}
                    minTickGap={12}
                  />
                  <YAxis
                    tickFormatter={compactINR}
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={64}
                  />
                  <RTooltip
                    cursor={{ stroke: c.baseline, strokeWidth: 1 }}
                    content={
                      <ChartTooltip c={c} formatValue={(v) => formatINR(v)} />
                    }
                  />
                  <Line
                    type="linear"
                    dataKey="gross"
                    name="Gross salary"
                    stroke={s1}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={endDot(s1)}
                    activeDot={{
                      r: 4,
                      fill: s1,
                      stroke: c.surface,
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="linear"
                    dataKey="net"
                    name="Net salary"
                    stroke={s2}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={endDot(s2)}
                    activeDot={{
                      r: 4,
                      fill: s2,
                      stroke: c.surface,
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Col>

          <Col xs={24} xl={8}>
            <ChartCard
              title="Payroll status"
              subtitle={`Payrolls by status · ${periodLabel}`}
              ariaLabel={`Donut chart of ${totalPayrolls} payrolls by status. Switch to table view for the numbers.`}
              columns={statusColumns}
              data={statusData}
              isEmpty={totalPayrolls === 0}
              emptyText="No payroll in this period."
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 24,
                }}
              >
                <div style={{ position: "relative", width: 190, height: 190 }}>
                  <PieChart width={190} height={190}>
                    <RTooltip
                      content={
                        <ChartTooltip
                          c={c}
                          formatValue={(v) => `${v} payrolls`}
                        />
                      }
                    />
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      stroke={c.surface}
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {statusPieData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{ fontSize: 28, fontWeight: 600, color: c.ink }}
                    >
                      {totalPayrolls}
                    </span>
                    <span style={{ fontSize: 12, color: c.muted }}>
                      payrolls
                    </span>
                  </div>
                </div>

                <div style={{ flex: "1 1 150px", minWidth: 150 }}>
                  {statusData.map((entry) => (
                    <div
                      key={entry.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 0",
                        fontSize: 13,
                        color: c.inkSecondary,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: entry.color,
                          flex: "none",
                        }}
                      />
                      <span style={{ flex: 1 }}>{entry.name}</span>
                      <span style={{ color: c.ink, fontWeight: 600 }}>
                        {entry.value}
                      </span>
                      <span
                        style={{
                          width: 40,
                          textAlign: "right",
                          color: c.muted,
                          ...tabular,
                        }}
                      >
                        {totalPayrolls
                          ? `${Math.round((entry.value / totalPayrolls) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </Col>
        </Row>

        {/* Charts, row 2 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={10}>
            <ChartCard
              title={
                barMode === "company"
                  ? "Employees by company"
                  : "Net payroll by employee"
              }
              subtitle={
                barMode === "company"
                  ? "Active employees per company"
                  : `Top earners · ${periodLabel}`
              }
              ariaLabel={
                barMode === "company"
                  ? "Bar chart of active employees per company. Switch to table view for the numbers."
                  : "Bar chart of net payroll per employee. Switch to table view for the numbers."
              }
              columns={barColumns}
              data={barRows}
              isEmpty={barRows.length === 0}
              emptyText={
                barMode === "company"
                  ? "No companies yet."
                  : "No payroll in this period."
              }
            >
              <ResponsiveContainer width="100%" height={barHeight}>
                <BarChart
                  layout="vertical"
                  data={barRows}
                  margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
                  barCategoryGap={12}
                >
                  <CartesianGrid horizontal={false} stroke={c.grid} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickFormatter={
                      barMode === "company" ? undefined : compactINR
                    }
                    tickLine={false}
                    axisLine={{ stroke: c.baseline }}
                    tick={axisTick}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={112}
                    tickFormatter={truncate}
                    tickLine={false}
                    axisLine={{ stroke: c.baseline }}
                    tick={{ fill: c.inkSecondary, fontSize: 12 }}
                  />
                  <RTooltip
                    cursor={{ fill: c.grid, fillOpacity: 0.5 }}
                    content={
                      <ChartTooltip
                        c={c}
                        formatValue={(v) =>
                          barMode === "company" ? v : formatINR(v)
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    name={
                      barMode === "company" ? "Active employees" : "Net salary"
                    }
                    fill={s1}
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      fill={c.ink}
                      fontSize={12}
                      formatter={barMode === "company" ? undefined : compactINR}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Col>

          <Col xs={24} xl={14}>
            <Card
              variant="borderless"
              title={<span style={{ fontSize: 15 }}>Recent payroll</span>}
              extra={
                recentRows.length > 0 && (
                  <Text style={{ color: token.colorTextSecondary }}>
                    Latest: {monthLabelLong(recentRows[0])}
                  </Text>
                )
              }
              styles={{
                header: {
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                },
                body: { padding: "4px 8px 8px" },
              }}
              style={{
                height: "100%",
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Table
                rowKey="id"
                pagination={false}
                dataSource={recentRows}
                scroll={{ x: 520 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No payroll runs yet. Run payroll to see it here."
                    />
                  ),
                }}
                columns={[
                  {
                    title: "Employee",
                    key: "employee",
                    render: (_, record) => (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text strong style={{ lineHeight: 1.3 }}>
                          {employeeName(record.employee)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: token.colorTextSecondary,
                            lineHeight: 1.3,
                          }}
                        >
                          {record.employee?.employeeCode}
                        </Text>
                      </div>
                    ),
                  },
                  {
                    title: "Month",
                    key: "month",
                    render: (_, record) => monthLabelLong(record),
                  },
                  {
                    title: "Net salary",
                    dataIndex: "netSalary",
                    key: "netSalary",
                    align: "right",
                    render: (v) => (
                      <Text strong style={tabular}>
                        {formatINR(v)}
                      </Text>
                    ),
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (status) => (
                      <Tag
                        color={STATUS_TAG_COLORS[status] ?? "default"}
                        variant="filled"
                        style={{
                          marginInlineEnd: 0,
                          borderRadius: 6,
                          fontWeight: 500,
                        }}
                      >
                        {STATUS_LABELS[status] ?? status}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Reports */}
        <Card
          variant="borderless"
          styles={{ body: { padding: 0 } }}
          style={{
            marginTop: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 12,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              padding: "16px 20px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <div>
              <Text strong style={{ fontSize: 15 }}>
                Reports
              </Text>
              <Text
                style={{
                  display: "block",
                  fontSize: 12,
                  color: token.colorTextSecondary,
                }}
              >
                {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}
                {companyFilter ? " · selected company" : " · all companies"}
              </Text>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Segmented
                value={reportTab}
                onChange={setReportTab}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "company", label: "By company" },
                  { value: "employee", label: "By employee" },
                ]}
              />

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                style={{ color: BRAND, borderColor: BRAND }}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <Table
            rowKey="key"
            columns={reportColumns}
            dataSource={activeReport.rows}
            scroll={{ x: 760 }}
            pagination={
              activeReport.rows.length > 12
                ? { pageSize: 12, showSizeChanger: false }
                : false
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No data for this period."
                />
              ),
            }}
            summary={() =>
              activeReport.totals && activeReport.rows.length > 0 ? (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    {activeReport.fields.map((field, index) => (
                      <Table.Summary.Cell
                        key={field.key}
                        index={index}
                        align={field.type === "text" ? undefined : "right"}
                      >
                        {index === 0 ? (
                          <Text strong>Total</Text>
                        ) : field.sum ? (
                          <Text strong style={tabular}>
                            {field.type === "money"
                              ? formatINR(
                                  sum(activeReport.rows, (r) => r[field.key]),
                                )
                              : sum(activeReport.rows, (r) => r[field.key])}
                          </Text>
                        ) : null}
                      </Table.Summary.Cell>
                    ))}
                  </Table.Summary.Row>
                </Table.Summary>
              ) : null
            }
          />
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
