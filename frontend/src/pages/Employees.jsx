import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
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
  CheckCircleFilled,
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import api from "../services/api";

const { Title, Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with Navbar, Sidebar, Dashboard, Companies
const BRAND_TINT = "#E6F4F2";

const getInitials = (employee) =>
  `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();

function Employees() {
  const { message, modal } = AntdApp.useApp();
  const { token } = theme.useToken();

  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);

      message.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies");

      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);

      message.error("Failed to load companies");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (companyFilter && employee.companyId !== companyFilter) return false;
      if (statusFilter === "active" && !employee.isActive) return false;
      if (statusFilter === "inactive" && employee.isActive) return false;

      if (!term) return true;

      return [
        employee.firstName,
        employee.lastName,
        employee.employeeCode,
        employee.email,
        employee.phone,
        employee.company?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [employees, search, companyFilter, statusFilter]);

  const openAddModal = () => {
    setEditingEmployee(null);

    form.resetFields();

    setModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);

    form.setFieldsValue({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,

      dateOfJoining: employee.dateOfJoining
        ? dayjs(employee.dateOfJoining)
        : null,

      dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : null,

      panNumber: employee.panNumber,
      uanNumber: employee.uanNumber,
      esiNumber: employee.esiNumber,
      bankAccount: employee.bankAccount,
      bankName: employee.bankName,
      ifscCode: employee.ifscCode,
      companyId: employee.companyId,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);

    setEditingEmployee(null);

    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const employeeData = {
        ...values,

        dateOfJoining: values.dateOfJoining
          ? values.dateOfJoining.format("YYYY-MM-DD")
          : null,

        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,

        companyId: Number(values.companyId),
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, employeeData);

        message.success("Employee updated successfully");
      } else {
        await api.post("/employees", employeeData);

        message.success("Employee created successfully");
      }

      closeModal();

      fetchEmployees();
    } catch (error) {
      console.error("Failed to save employee:", error);

      message.error(error.response?.data?.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employeeId) => {
    try {
      await api.delete(`/employees/${employeeId}`);

      message.success("Employee deleted successfully");

      fetchEmployees();
    } catch (error) {
      console.error("Failed to delete employee:", error);

      message.error(
        error.response?.data?.message || "Failed to delete employee",
      );
    }
  };

  const handleDeactivate = async (employeeId) => {
    try {
      await api.patch(`/employees/${employeeId}/deactivate`);

      message.success("Employee deactivated successfully");

      fetchEmployees();
    } catch (error) {
      console.error("Failed to deactivate employee:", error);

      message.error(
        error.response?.data?.message || "Failed to deactivate employee",
      );
    }
  };

  const handleActivate = async (employeeId) => {
    try {
      await api.patch(`/employees/${employeeId}/activate`);

      message.success("Employee activated successfully");

      fetchEmployees();
    } catch (error) {
      console.error("Failed to activate employee:", error);

      message.error(
        error.response?.data?.message || "Failed to activate employee",
      );
    }
  };

  // Centered confirmation window, used for deactivate, activate and delete.
  const confirmAction = ({ title, content, okText, danger, icon, onOk }) =>
    modal.confirm({
      title,
      content,
      icon,
      okText,
      cancelText: "Cancel",
      centered: true,
      width: 440,
      okButtonProps: danger
        ? { danger: true }
        : { style: { background: BRAND } },
      onOk,
    });

  const confirmDeactivate = (employee) =>
    confirmAction({
      title: "Deactivate Employee",
      content: `Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`,
      okText: "Deactivate",
      icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
      onOk: () => handleDeactivate(employee.id),
    });

  const confirmActivate = (employee) =>
    confirmAction({
      title: "Activate Employee",
      content: `Are you sure you want to activate ${employee.firstName} ${employee.lastName}?`,
      okText: "Activate",
      icon: <CheckCircleFilled style={{ color: BRAND }} />,
      onOk: () => handleActivate(employee.id),
    });

  const confirmDelete = (employee) =>
    confirmAction({
      title: "Delete Employee",
      content: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
      okText: "Delete",
      danger: true,
      icon: <ExclamationCircleFilled style={{ color: token.colorError }} />,
      onOk: () => handleDelete(employee.id),
    });

  const muted = (value) =>
    value ? (
      <Text>{value}</Text>
    ) : (
      <Text style={{ color: token.colorTextQuaternary }}>-</Text>
    );

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, employee) => (
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
            {getInitials(employee)}
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
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      render: muted,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: muted,
    },
    {
      title: "Company",
      key: "company",
      render: (_, employee) => muted(employee.company?.name),
    },
    {
      title: "Joined",
      dataIndex: "dateOfJoining",
      key: "dateOfJoining",
      render: (date) => muted(date ? dayjs(date).format("DD MMM YYYY") : null),
    },
    {
      title: "Status",
      key: "status",
      render: (_, employee) => (
        <Tag
          color={employee.isActive ? "green" : "red"}
          variant="filled"
          style={{ marginInlineEnd: 0, borderRadius: 6, fontWeight: 500 }}
        >
          {employee.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 140,
      render: (_, employee) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
          <Tooltip title="Edit">
            <Button
              type="text"
              aria-label={`Edit ${employee.firstName} ${employee.lastName}`}
              icon={<EditOutlined />}
              onClick={() => openEditModal(employee)}
            />
          </Tooltip>

          {employee.isActive ? (
            <>
              <Tooltip title="Deactivate">
                <Button
                  type="text"
                  aria-label={`Deactivate ${employee.firstName}`}
                  icon={<StopOutlined />}
                  onClick={() => confirmDeactivate(employee)}
                />
              </Tooltip>

              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  aria-label={`Delete ${employee.firstName}`}
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(employee)}
                />
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Activate">
              <Button
                type="text"
                aria-label={`Activate ${employee.firstName}`}
                icon={<CheckCircleOutlined style={{ color: BRAND }} />}
                onClick={() => confirmActivate(employee)}
              />
            </Tooltip>
          )}
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
            Employees
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Manage employees in your payroll system.
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{ background: BRAND }}
        >
          Add Employee
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
            placeholder="Search by name, code, email or phone"
            prefix={
              <SearchOutlined style={{ color: token.colorTextTertiary }} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320, maxWidth: "100%" }}
          />

          <Select
            allowClear
            placeholder="All companies"
            value={companyFilter}
            onChange={setCompanyFilter}
            options={companies.map((company) => ({
              value: company.id,
              label: company.name,
            }))}
            style={{ width: 180 }}
          />

          <Select
            allowClear
            placeholder="All statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            style={{ width: 150 }}
          />

          <Text style={{ marginLeft: "auto", color: token.colorTextSecondary }}>
            {filteredEmployees.length}{" "}
            {filteredEmployees.length === 1 ? "employee" : "employees"}
          </Text>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredEmployees}
          loading={loading}
          scroll={{ x: 960 }}
          pagination={
            filteredEmployees.length > 10
              ? { pageSize: 10, showSizeChanger: false }
              : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search || companyFilter || statusFilter
                    ? "No employees match your filters."
                    : "No employees yet. Add your first employee to get started."
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        width={800}
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
          {sectionTitle("Basic details")}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Employee Code"
                name="employeeCode"
                rules={[
                  { required: true, message: "Please enter employee code" },
                ]}
              >
                <Input placeholder="EMP002" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Company"
                name="companyId"
                rules={[{ required: true, message: "Please select company" }]}
              >
                <Select
                  placeholder="Select company"
                  options={companies.map((company) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="employee@example.com" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Date of Joining"
                name="dateOfJoining"
                rules={[
                  { required: true, message: "Please select date of joining" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Date of Birth" name="dateOfBirth">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {sectionTitle("Statutory details")}
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="PAN Number" name="panNumber">
                <Input placeholder="PAN number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="UAN Number" name="uanNumber">
                <Input placeholder="UAN number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="ESI Number" name="esiNumber">
                <Input placeholder="ESI number" />
              </Form.Item>
            </Col>
          </Row>

          {sectionTitle("Bank details")}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Bank Account" name="bankAccount">
                <Input placeholder="Bank account number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Bank Name" name="bankName">
                <Input placeholder="Bank name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="IFSC Code" name="ifscCode">
                <Input placeholder="IFSC code" />
              </Form.Item>
            </Col>
          </Row>

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
              {editingEmployee ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Employees;
