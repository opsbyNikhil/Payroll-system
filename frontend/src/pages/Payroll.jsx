import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import api from "../services/api";

const { Title, Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with the other pages
const BRAND_TINT = "#E6F4F2";

const STATUS_COLORS = {
  DRAFT: "orange",
  PROCESSED: "blue",
  PAID: "green",
};

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatMonth = (month, year) =>
  dayjs(new Date(Number(year), Number(month) - 1, 1)).format("MMMM YYYY");

const titleCase = (text = "") => text.charAt(0) + text.slice(1).toLowerCase();

function Payroll() {
  const { message, modal } = AntdApp.useApp();
  const { token } = theme.useToken();

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const [form] = Form.useForm();

  const fetchPayrolls = async () => {
    try {
      setLoading(true);

      const response = await api.get("/payroll");

      setPayrolls(response.data);
    } catch (error) {
      console.error("Failed to fetch payroll:", error);

      message.error(error.response?.data?.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);

      message.error(
        error.response?.data?.message || "Failed to load employees",
      );
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const filteredPayrolls = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payrolls.filter((record) => {
      if (statusFilter && record.status !== statusFilter) return false;
      if (!term) return true;

      return [
        record.employee?.firstName,
        record.employee?.lastName,
        record.employee?.employeeCode,
        record.company?.name,
        formatMonth(record.payrollMonth, record.payrollYear),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [payrolls, search, statusFilter]);

  const openCreateModal = () => {
    form.resetFields();

    form.setFieldsValue({
      payrollDate: dayjs(),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    form.resetFields();
  };

  const handleCreatePayroll = async (values) => {
    try {
      setSubmitting(true);

      const payrollData = {
        employeeId: values.employeeId,
        companyId: values.companyId,
        payrollMonth: values.payrollDate.month() + 1,
        payrollYear: values.payrollDate.year(),
      };

      await api.post("/payroll", payrollData);

      message.success("Payroll created successfully");

      closeModal();

      fetchPayrolls();
    } catch (error) {
      console.error("Failed to create payroll:", error);

      message.error(
        error.response?.data?.message || "Failed to create payroll",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (record) => {
    setSelectedPayroll(record);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedPayroll(null);
  };

  const handleProcessPayroll = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId}/process`);

      message.success("Payroll processed successfully");

      fetchPayrolls();
    } catch (error) {
      console.error("Failed to process payroll:", error);

      message.error(
        error.response?.data?.message || "Failed to process payroll",
      );
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId}/pay`);

      message.success("Payroll marked as paid");

      fetchPayrolls();
    } catch (error) {
      console.error("Failed to mark payroll as paid:", error);

      message.error(
        error.response?.data?.message || "Failed to mark payroll as paid",
      );
    }
  };

  const handleGeneratePayslip = async (payrollId) => {
    try {
      const checkResponse = await api.get(`/payroll/${payrollId}/payslip`);

      if (!checkResponse?.data?.exists) {
        const response = await api.post(`/payroll/${payrollId}/payslip`);

        message.success(
          response?.data?.message || "Payslip generated successfully",
        );

        return;
      }

      modal.confirm({
        title: "Payslip Already Exists",
        content:
          "A payslip has already been generated for this payroll. Do you want to recreate the payslip?",
        icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
        okText: "Recreate Payslip",
        cancelText: "Cancel",
        okButtonProps: { style: { background: BRAND } },
        centered: true,
        width: 440,
        onOk: async () => {
          try {
            const response = await api.post(`/payroll/${payrollId}/payslip`);

            message.success(
              response?.data?.message || "Payslip recreated successfully",
            );
          } catch (error) {
            console.error("Failed to recreate payslip:", error);

            message.error(
              error?.response?.data?.message || "Failed to recreate payslip",
            );
          }
        },
      });
    } catch (error) {
      console.error("Failed to check payslip:", error);

      message.error(
        error?.response?.data?.message || "Failed to check payslip",
      );
    }
  };

  const handleDeletePayroll = async (payrollId) => {
    try {
      await api.delete(`/payroll/${payrollId}`);

      message.success("Payroll deleted successfully");

      fetchPayrolls();
    } catch (error) {
      console.error("Failed to delete payroll:", error);

      message.error(
        error.response?.data?.message || "Failed to delete payroll",
      );
    }
  };

  const confirmDelete = (record) => {
    const name = record.employee
      ? `${record.employee.firstName} ${record.employee.lastName}`
      : "this employee";

    modal.confirm({
      title: "Delete Payroll",
      content: `Are you sure you want to delete the ${formatMonth(record.payrollMonth, record.payrollYear)} payroll for ${name}? This action cannot be undone.`,
      icon: <ExclamationCircleFilled style={{ color: token.colorError }} />,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      centered: true,
      width: 440,
      onOk: () => handleDeletePayroll(record.id),
    });
  };

  const statusTag = (status) => (
    <Tag
      color={STATUS_COLORS[status] ?? "default"}
      variant="filled"
      style={{ marginInlineEnd: 0, borderRadius: 6, fontWeight: 500 }}
    >
      {titleCase(status)}
    </Tag>
  );

  const money = (value) => (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatINR(value)}
    </span>
  );

  const employeeLabel = (employee) =>
    employee
      ? `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`
      : "-";

  const payrollItemColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value) => (
        <Tag
          color={value === "EARNING" ? "green" : "red"}
          variant="filled"
          style={{ marginInlineEnd: 0, borderRadius: 6, fontWeight: 500 }}
        >
          {titleCase(value)}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: money,
    },
  ];

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => {
        const employee = record.employee;

        if (!employee) {
          return <Text style={{ color: token.colorTextQuaternary }}>-</Text>;
        }

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              size={36}
              style={{
                flex: "none",
                background: BRAND_TINT,
                color: BRAND,
                fontWeight: 600,
              }}
            >
              {`${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase()}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Text strong style={{ lineHeight: 1.2 }}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 1.2,
                  color: token.colorTextSecondary,
                }}
              >
                {employee.employeeCode}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Company",
      key: "company",
      render: (_, record) =>
        record.company?.name ? (
          <Text>{record.company.name}</Text>
        ) : (
          <Text style={{ color: token.colorTextQuaternary }}>-</Text>
        ),
    },
    {
      title: "Month",
      key: "month",
      render: (_, record) =>
        formatMonth(record.payrollMonth, record.payrollYear),
    },
    {
      title: "Gross salary",
      dataIndex: "grossSalary",
      key: "grossSalary",
      align: "right",
      render: money,
    },
    {
      title: "Deductions",
      dataIndex: "totalDeductions",
      key: "totalDeductions",
      align: "right",
      render: money,
    },
    {
      title: "Net salary",
      dataIndex: "netSalary",
      key: "netSalary",
      align: "right",
      render: (value) => (
        <Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatINR(value)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: statusTag,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      align: "right",
      width: 190,
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Tooltip title="View details">
            <Button
              type="text"
              aria-label="View payroll details"
              icon={<EyeOutlined />}
              onClick={() => openDetails(record)}
            />
          </Tooltip>

          <Tooltip title="Generate payslip">
            <Button
              type="text"
              aria-label="Generate payslip"
              icon={<FilePdfOutlined />}
              onClick={() => handleGeneratePayslip(record.id)}
            />
          </Tooltip>

          {record.status === "DRAFT" && (
            <Tooltip title="Process payroll">
              <Button
                type="text"
                aria-label="Process payroll"
                icon={<PlayCircleOutlined style={{ color: "#1677ff" }} />}
                onClick={() => handleProcessPayroll(record.id)}
              />
            </Tooltip>
          )}

          {record.status === "PROCESSED" && (
            <Tooltip title="Mark as paid">
              <Button
                type="text"
                aria-label="Mark payroll as paid"
                icon={<CheckCircleOutlined style={{ color: BRAND }} />}
                onClick={() => handleMarkPaid(record.id)}
              />
            </Tooltip>
          )}

          {record.status !== "PAID" && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                aria-label="Delete payroll"
                icon={<DeleteOutlined />}
                onClick={() => confirmDelete(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const infoItem = (label, value) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
        {label}
      </Text>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );

  const summaryRow = (label, value, strong) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
      }}
    >
      <Text
        style={{
          color: strong ? BRAND : token.colorTextSecondary,
          fontWeight: strong ? 600 : 400,
        }}
      >
        {label}
      </Text>
      <Text
        strong={strong}
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: strong ? 18 : 14,
          color: strong ? BRAND : undefined,
        }}
      >
        {formatINR(value)}
      </Text>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, letterSpacing: "-0.02em" }}>
            Payroll
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Manage employee payroll processing.
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          style={{ background: BRAND }}
        >
          Create Payroll
        </Button>
      </div>

      <Card
        variant="borderless"
        styles={{ body: { padding: 0 } }}
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Input
            allowClear
            placeholder="Search by employee, company or month"
            prefix={
              <SearchOutlined style={{ color: token.colorTextTertiary }} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320, maxWidth: "100%" }}
          />

          <Select
            allowClear
            placeholder="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PROCESSED", label: "Processed" },
              { value: "PAID", label: "Paid" },
            ]}
            style={{ width: 160 }}
          />

          <Text style={{ marginLeft: "auto", color: token.colorTextSecondary }}>
            {filteredPayrolls.length}{" "}
            {filteredPayrolls.length === 1 ? "payroll" : "payrolls"}
          </Text>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredPayrolls}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={
            filteredPayrolls.length > 10
              ? { pageSize: 10, showSizeChanger: false }
              : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search || statusFilter
                    ? "No payroll matches your filters."
                    : "No payroll yet. Create your first payroll to get started."
                }
              />
            ),
          }}
        />
      </Card>

      {/* Details modal */}
      <Modal
        title={
          selectedPayroll ? `Payroll #${selectedPayroll.id}` : "Payroll Details"
        }
        open={detailsOpen}
        onCancel={closeDetails}
        footer={null}
        centered
        width={760}
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto", paddingRight: 4 },
        }}
      >
        {selectedPayroll && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                padding: 16,
                borderRadius: 10,
                background: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              {infoItem("Employee", employeeLabel(selectedPayroll.employee))}
              {infoItem("Company", selectedPayroll.company?.name || "-")}
              {infoItem(
                "Payroll month",
                formatMonth(
                  selectedPayroll.payrollMonth,
                  selectedPayroll.payrollYear,
                ),
              )}
              {infoItem("Status", statusTag(selectedPayroll.status))}
            </div>

            <Title level={5} style={{ margin: "24px 0 8px" }}>
              Payroll items
            </Title>

            <Table
              rowKey="id"
              size="small"
              columns={payrollItemColumns}
              dataSource={selectedPayroll.items || []}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No payroll items."
                  />
                ),
              }}
            />

            <div
              style={{
                marginTop: 20,
                marginLeft: "auto",
                maxWidth: 340,
                padding: "8px 16px",
                borderRadius: 10,
                background: BRAND_TINT,
              }}
            >
              {summaryRow("Gross salary", selectedPayroll.grossSalary)}
              {summaryRow("Total deductions", selectedPayroll.totalDeductions)}
              <div
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  marginTop: 4,
                  paddingTop: 4,
                }}
              >
                {summaryRow("Net salary", selectedPayroll.netSalary, true)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        title="Create Payroll"
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleCreatePayroll}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Employee"
            name="employeeId"
            rules={[{ required: true, message: "Please select an employee" }]}
          >
            <Select
              size="large"
              placeholder="Select employee"
              showSearch
              optionFilterProp="label"
              options={employees
                .filter((employee) => employee.isActive)
                .map((employee) => ({
                  value: employee.id,
                  label: `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
                }))}
              onChange={(employeeId) => {
                const employee = employees.find(
                  (item) => item.id === employeeId,
                );

                form.setFieldsValue({
                  companyId: employee?.companyId,
                });
              }}
            />
          </Form.Item>

          <Form.Item name="companyId" hidden>
            <input />
          </Form.Item>

          <Form.Item
            label="Payroll Month"
            name="payrollDate"
            rules={[{ required: true, message: "Please select payroll month" }]}
          >
            <DatePicker
              size="large"
              picker="month"
              style={{ width: "100%" }}
              format="MMMM YYYY"
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Button onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ background: BRAND }}
            >
              Create Payroll
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Payroll;
