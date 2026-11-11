import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import api from "../services/api";

const { Title, Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with Navbar, Sidebar and Dashboard
const BRAND_TINT = "#E6F4F2";

function Companies() {
  const { token } = theme.useToken();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [form] = Form.useForm();

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const response = await api.get("/companies");

      setCompanies(response.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);

      message.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;

    return companies.filter((company) =>
      [company.name, company.email, company.phone, company.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [companies, search]);

  const openAddModal = () => {
    setEditingCompany(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);

    form.setFieldsValue({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingCompany(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, values);

        message.success("Company updated successfully");
      } else {
        await api.post("/companies", values);

        message.success("Company created successfully");
      }

      closeModal();

      fetchCompanies();
    } catch (error) {
      console.error("Failed to save company:", error);

      message.error(error.response?.data?.message || "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (companyId) => {
    try {
      await api.delete(`/companies/${companyId}`);

      message.success("Company deleted successfully");

      fetchCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);

      message.error(
        error.response?.data?.message || "Failed to delete company",
      );
    }
  };

  const muted = (value) =>
    value ? (
      <Text>{value}</Text>
    ) : (
      <Text style={{ color: token.colorTextQuaternary }}>-</Text>
    );

  const columns = [
    {
      title: "Company",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            shape="square"
            size={36}
            style={{
              background: BRAND_TINT,
              color: BRAND,
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            {name?.charAt(0).toUpperCase()}
          </Avatar>
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: muted,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: muted,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: muted,
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <Tag
          color="green"
          variant="filled"
          style={{ marginInlineEnd: 0, borderRadius: 6, fontWeight: 500 }}
        >
          Active
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 110,
      render: (_, company) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
          <Tooltip title="Edit">
            <Button
              type="text"
              aria-label={`Edit ${company.name}`}
              icon={<EditOutlined />}
              onClick={() => openEditModal(company)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this company?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            placement="topRight"
            onConfirm={() => handleDelete(company.id)}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                aria-label={`Delete ${company.name}`}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

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
            Companies
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Manage companies in your payroll system.
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{ background: BRAND }}
        >
          Add Company
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
            placeholder="Search by name, email, phone or address"
            prefix={
              <SearchOutlined style={{ color: token.colorTextTertiary }} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />

          <Text style={{ color: token.colorTextSecondary }}>
            {filteredCompanies.length}{" "}
            {filteredCompanies.length === 1 ? "company" : "companies"}
          </Text>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredCompanies}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={
            filteredCompanies.length > 10
              ? { pageSize: 10, showSizeChanger: false }
              : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search
                    ? "No companies match your search."
                    : "No companies yet. Add your first company to get started."
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={editingCompany ? "Edit Company" : "Add Company"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        destroyOnHidden
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Company Name"
            name="name"
            rules={[
              {
                required: true,
                message: "Please enter company name",
              },
            ]}
          >
            <Input placeholder="Enter company name" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                type: "email",
                message: "Please enter a valid email",
              },
            ]}
          >
            <Input placeholder="Enter company email" size="large" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" size="large" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} placeholder="Enter company address" />
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
              {editingCompany ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Companies;
