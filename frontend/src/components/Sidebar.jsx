import { useState } from "react";
import { ConfigProvider, Layout, Menu, Typography, theme } from "antd";
import {
  BankOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ProfileOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { Text } = Typography;

const BRAND = "#0F766E"; // keep in sync with Navbar
const BRAND_TINT = "#E6F4F2";

const menuItems = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    type: "group",
    label: "Organization",
    children: [
      { key: "/companies", icon: <BankOutlined />, label: "Companies" },
      { key: "/employees", icon: <TeamOutlined />, label: "Employees" },
    ],
  },
  {
    type: "group",
    label: "Payroll",
    children: [
      {
        key: "/salary-structures",
        icon: <ProfileOutlined />,
        label: "Salary Structures",
      },
      { key: "/payroll", icon: <WalletOutlined />, label: "Run Payroll" },
      { key: "/payslips", icon: <FileTextOutlined />, label: "Payslips" },
    ],
  },
];

// Flat list of route keys, used to keep the right item highlighted on nested
// routes such as /employees/12 or /payslips/2025-04.
const routeKeys = menuItems.flatMap((item) =>
  item.children ? item.children.map((c) => c.key) : [item.key],
);

function getSelectedKey(pathname) {
  if (pathname === "/") return "/";
  const matches = routeKeys.filter(
    (key) =>
      key !== "/" && (pathname === key || pathname.startsWith(key + "/")),
  );
  // Longest match wins
  return matches.sort((a, b) => b.length - a.length)[0];
}

/**
 * showBrand: set to false if your Navbar already shows the app name above
 * the sidebar, so the name isn't repeated.
 */
function Sidebar({ showBrand = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = getSelectedKey(location.pathname);

  return (
    <Sider
      width={240}
      collapsedWidth={72}
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      theme="light"
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {showBrand && (
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: collapsed ? "0 18px" : "0 20px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              flex: "none",
              width: 36,
              height: 36,
              borderRadius: 10,
              background: BRAND,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}
          >
            <BankOutlined />
          </div>
          {!collapsed && (
            <Text
              strong
              style={{
                fontSize: 17,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              Payroll System
            </Text>
          )}
        </div>
      )}

      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemHeight: 42,
              itemMarginInline: 12,
              itemBorderRadius: 8,
              itemSelectedBg: BRAND_TINT,
              itemSelectedColor: BRAND,
              itemHoverBg: "#F3F4F6",
              groupTitleFontSize: 12,
            },
          },
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderInlineEnd: 0,
            marginTop: 12,
            paddingBottom: 12,
            fontWeight: 500,
          }}
        />
      </ConfigProvider>
    </Sider>
  );
}

export default Sidebar;
