import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Calendar,
  Card,
  Empty,
  Input,
  Popover,
  Segmented,
  Spin,
  Table,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  CalendarOutlined,
  FilePdfOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import api from "../services/api";

const { Title, Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with the other pages
const BRAND_TINT = "#E6F4F2";

const MAX_TAGS_PER_DAY = 2;

const openPayslipPdf = (payslip) => {
  window.open(
    `${api.defaults.baseURL}/payroll/payslips/history/${payslip.id}/pdf`,
    "_blank",
    "noopener,noreferrer",
  );
};

function Payslips() {
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("calendar");
  const [search, setSearch] = useState("");

  const fetchPayslipHistory = async () => {
    try {
      setLoading(true);

      const response = await api.get("/payroll/payslips/history");

      setPayslips(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch payslip history:", error);

      message.error(
        error?.response?.data?.message || "Failed to fetch payslip history",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslipHistory();
  }, []);

  const filteredPayslips = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payslips;

    return payslips.filter((payslip) =>
      String(payslip.employeeCode ?? "")
        .toLowerCase()
        .includes(term),
    );
  }, [payslips, search]);

  // Newest first for the list view
  const sortedPayslips = useMemo(
    () =>
      [...filteredPayslips].sort(
        (a, b) =>
          dayjs(b.generatedAt).valueOf() - dayjs(a.generatedAt).valueOf(),
      ),
    [filteredPayslips],
  );

  const getPayslipsForDate = (date) =>
    filteredPayslips.filter((payslip) =>
      dayjs(payslip.generatedAt).isSame(date, "day"),
    );

  const payslipTag = (payslip) => (
    <Tooltip key={payslip.id} title="Open payslip PDF">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          openPayslipPdf(payslip);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPayslipPdf(payslip);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
          padding: "2px 8px",
          borderRadius: 6,
          background: BRAND_TINT,
          color: BRAND,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <FilePdfOutlined />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {payslip.employeeCode}
        </span>
      </div>
    </Tooltip>
  );

  const cellRender = (date, info) => {
    if (info.type !== "date") {
      return info.originNode;
    }

    const dayPayslips = getPayslipsForDate(date);

    if (dayPayslips.length === 0) {
      return null;
    }

    const visible = dayPayslips.slice(0, MAX_TAGS_PER_DAY);
    const rest = dayPayslips.slice(MAX_TAGS_PER_DAY);

    return (
      <div>
        {visible.map(payslipTag)}

        {rest.length > 0 && (
          <Popover
            trigger="click"
            title={date.format("DD MMM YYYY")}
            content={
              <div style={{ minWidth: 160 }}>{rest.map(payslipTag)}</div>
            }
          >
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              +{rest.length} more
            </div>
          </Popover>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Employee code",
      dataIndex: "employeeCode",
      key: "employeeCode",
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: "Generated on",
      dataIndex: "generatedAt",
      key: "generatedAt",
      render: (value) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
    },
    {
      title: "Payslip",
      key: "actions",
      align: "right",
      width: 140,
      render: (_, payslip) => (
        <Button
          type="text"
          icon={<FilePdfOutlined />}
          style={{ color: BRAND }}
          onClick={() => openPayslipPdf(payslip)}
        >
          Open PDF
        </Button>
      ),
    },
  ];

  const hasPayslips = payslips.length > 0;

  return (
    <div style={{ width: "100%" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, letterSpacing: "-0.02em" }}>
          Payslips
        </Title>
        <Text style={{ color: token.colorTextSecondary }}>
          View generated payslips by date and open them as PDF.
        </Text>
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
        {hasPayslips && (
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
            <Segmented
              value={view}
              onChange={setView}
              options={[
                {
                  value: "calendar",
                  icon: <CalendarOutlined />,
                  label: "Calendar",
                },
                {
                  value: "list",
                  icon: <UnorderedListOutlined />,
                  label: "List",
                },
              ]}
            />

            <Input
              allowClear
              placeholder="Search by employee code"
              prefix={
                <SearchOutlined style={{ color: token.colorTextTertiary }} />
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260, maxWidth: "100%" }}
            />

            <Text
              style={{ marginLeft: "auto", color: token.colorTextSecondary }}
            >
              {filteredPayslips.length}{" "}
              {filteredPayslips.length === 1 ? "payslip" : "payslips"}
            </Text>
          </div>
        )}

        <Spin spinning={loading}>
          {!hasPayslips && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No payslips generated yet. Generate one from the Payroll page."
              style={{ padding: "48px 0" }}
            />
          ) : view === "calendar" ? (
            <div style={{ padding: "8px 16px 16px", overflowX: "auto" }}>
              <div style={{ minWidth: 720 }}>
                <Calendar cellRender={cellRender} />
              </div>
            </div>
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={sortedPayslips}
              pagination={
                sortedPayslips.length > 10
                  ? { pageSize: 10, showSizeChanger: false }
                  : false
              }
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No payslips match your search."
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}

export default Payslips;
