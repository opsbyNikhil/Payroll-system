import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import api from "../services/api";

const { Title, Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with the other pages
const BRAND_TINT = "#E6F4F2";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const EARNING_FIELDS = [
  "basicSalary",
  "hra",
  "conveyance",
  "medicalAllowance",
  "specialAllowance",
  "otherAllowance",
];

const getGross = (source = {}) =>
  EARNING_FIELDS.reduce((sum, field) => sum + Number(source[field] || 0), 0);

function SalaryStructures() {
  const { message, modal } = AntdApp.useApp();
  const { token } = theme.useToken();

  const [salaryStructures, setSalaryStructures] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);

  const [form] = Form.useForm();

  // Live gross preview inside the modal
  const watched = Form.useWatch([], form);
  const previewGross = getGross(watched);

  const fetchSalaryStructures = async () => {
    try {
      setLoading(true);

      const response = await api.get("/salaries");

      setSalaryStructures(response.data);
    } catch (error) {
      console.error("Failed to fetch salary structures:", error);

      message.error(
        error.response?.data?.message || "Failed to load salary structures",
      );
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
    fetchSalaryStructures();
    fetchEmployees();
  }, []);

  const filteredStructures = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return salaryStructures;

    return salaryStructures.filter((record) =>
      [
        record.employee?.firstName,
        record.employee?.lastName,
        record.employee?.employeeCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [salaryStructures, search]);

  const openAddModal = () => {
    setEditingSalary(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingSalary(record);

    form.setFieldsValue({
      employeeId: record.employeeId,
      basicSalary: Number(record.basicSalary),
      hra: Number(record.hra),
      conveyance: Number(record.conveyance),
      medicalAllowance: Number(record.medicalAllowance),
      specialAllowance: Number(record.specialAllowance),
      otherAllowance: Number(record.otherAllowance),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingSalary(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const salaryData = {
        employeeId: Number(values.employeeId),
        basicSalary: Number(values.basicSalary),
        hra: Number(values.hra || 0),
        conveyance: Number(values.conveyance || 0),
        medicalAllowance: Number(values.medicalAllowance || 0),
        specialAllowance: Number(values.specialAllowance || 0),
        otherAllowance: Number(values.otherAllowance || 0),
      };

      if (editingSalary) {
        await api.put(`/salaries/${editingSalary.id}`, salaryData);
      } else {
        await api.post("/salaries", salaryData);
      }

      message.success(
        editingSalary
          ? "Salary structure updated successfully"
          : "Salary structure created successfully",
      );
      closeModal();

      fetchSalaryStructures();
      fetchEmployees();
    } catch (error) {
      console.error("Failed to save salary structure:", error);

      message.error(
        error.response?.data?.message || "Failed to save salary structure",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/salaries/${id}`);

      message.success("Salary structure deleted successfully");

      fetchSalaryStructures();
      fetchEmployees();
    } catch (error) {
      console.error("Failed to delete salary structure:", error);

      message.error(
        error.response?.data?.message || "Failed to delete salary structure",
      );
    }
  };

  const confirmDelete = (record) => {
    const name = record.employee
      ? `${record.employee.firstName} ${record.employee.lastName}`
      : "this employee";

    modal.confirm({
      title: "Delete Salary Structure",
      content: `Are you sure you want to delete the salary structure for ${name}? This action cannot be undone.`,
      icon: <ExclamationCircleFilled style={{ color: token.colorError }} />,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      centered: true,
      width: 440,
      onOk: () => handleDelete(record.id),
    });
  };

  const existingEmployeeIds = new Set(
    salaryStructures.map((salary) => salary.employeeId),
  );

  const availableEmployees = employees.filter(
    (employee) =>
      (editingSalary?.employeeId === employee.id ||
        !existingEmployeeIds.has(employee.id)) &&
      employee.isActive,
  );

  const money = (value) => (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatINR(value)}
    </span>
  );

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
      title: "Basic salary",
      dataIndex: "basicSalary",
      key: "basicSalary",
      align: "right",
      render: money,
    },
    {
      title: "HRA",
      dataIndex: "hra",
      key: "hra",
      align: "right",
      render: money,
    },
    {
      title: "Conveyance",
      dataIndex: "conveyance",
      key: "conveyance",
      align: "right",
      render: money,
    },
    {
      title: "Gross salary",
      key: "grossSalary",
      align: "right",
      render: (_, record) => (
        <Tag
          color="green"
          variant="filled"
          style={{
            marginInlineEnd: 0,
            borderRadius: 6,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatINR(getGross(record))}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 110,
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
          <Tooltip title="Edit">
            <Button
              type="text"
              aria-label="Edit salary structure"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              aria-label="Delete salary structure"
              icon={<DeleteOutlined />}
              onClick={() => confirmDelete(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const sectionTitle = (text) => (
    <Divider
      orientation="left"
      orientationMargin={0}
      style={{
        margin: "8px 0 16px",
        fontSize: 13,
        color: token.colorTextSecondary,
      }}
    >
      {text}
    </Divider>
  );

  const amountInput = (placeholder) => (
    <InputNumber
      style={{ width: "100%" }}
      min={0}
      addonBefore="₹"
      placeholder={placeholder}
    />
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
            Salary Structures
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Manage employee salary structures.
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{ background: BRAND }}
        >
          Add Salary Structure
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
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Input
            allowClear
            placeholder="Search by employee name or code"
            prefix={
              <SearchOutlined style={{ color: token.colorTextTertiary }} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />

          <Text style={{ color: token.colorTextSecondary }}>
            {filteredStructures.length}{" "}
            {filteredStructures.length === 1 ? "structure" : "structures"}
          </Text>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredStructures}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={
            filteredStructures.length > 10
              ? { pageSize: 10, showSizeChanger: false }
              : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search
                    ? "No salary structures match your search."
                    : "No salary structures yet. Add one to get started."
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={editingSalary ? "Edit Salary Structure" : "Add Salary Structure"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        width={700}
        styles={{
          body: { maxHeight: "70vh", overflowY: "auto", paddingRight: 4 },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          {sectionTitle("Employee")}
          <Form.Item
            label="Employee"
            name="employeeId"
            rules={[{ required: true, message: "Please select employee" }]}
          >
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="label"
              options={availableEmployees.map((employee) => ({
                value: employee.id,
                label: `${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
              }))}
            />
          </Form.Item>

          {sectionTitle("Earnings (monthly)")}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Basic Salary"
                name="basicSalary"
                rules={[
                  { required: true, message: "Please enter basic salary" },
                ]}
              >
                {amountInput("30000")}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="HRA" name="hra">
                {amountInput("12000")}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Conveyance" name="conveyance">
                {amountInput("3000")}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Medical Allowance" name="medicalAllowance">
                {amountInput("2000")}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Special Allowance" name="specialAllowance">
                {amountInput("5000")}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Other Allowance" name="otherAllowance">
                {amountInput("0")}
              </Form.Item>
            </Col>
          </Row>

          {/* Live gross preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: 10,
              background: BRAND_TINT,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: BRAND, fontWeight: 500 }}>Gross salary</Text>
            <Text
              strong
              style={{
                color: BRAND,
                fontSize: 18,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatINR(previewGross)}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
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
              {editingSalary
                ? "Update Salary Structure"
                : "Create Salary Structure"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default SalaryStructures;
