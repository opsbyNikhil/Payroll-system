import {
  Layout,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Grid,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  BankOutlined,
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Header } = Layout;
const { Text } = Typography;

const BRAND = "#0F766E"; // deep teal; swap for your app's primary color

function Navbar({
  user = { name: "Admin", email: "admin@company.com", role: "Administrator" },
  notifications = 3,
  onProfile,
  onSettings,
  onLogout,
  onNotifications,
}) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      key: "account",
      disabled: true,
      style: { cursor: "default", padding: "12px 16px" },
      label: (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Text strong style={{ color: token.colorText }}>
            {user.name}
          </Text>
          <Text style={{ color: token.colorTextSecondary, fontSize: 12 }}>
            {user.email}
          </Text>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: onProfile,
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: onSettings,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 64,
        padding: isMobile ? "0 16px" : "0 28px",
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        lineHeight: 1,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
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
        <Text
          strong
          style={{
            fontSize: isMobile ? 16 : 18,
            letterSpacing: "-0.01em",
            color: token.colorText,
          }}
        >
          Payroll Management
        </Text>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tooltip title="Notifications">
          <Badge count={notifications} size="small" offset={[-4, 6]}>
            <Button
              type="text"
              shape="circle"
              aria-label="Notifications"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              onClick={onNotifications}
              style={{ width: 40, height: 40 }}
            />
          </Badge>
        </Tooltip>

        <div
          aria-hidden="true"
          style={{
            width: 1,
            height: 24,
            background: token.colorBorderSecondary,
            margin: "0 8px",
          }}
        />

        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
          overlayStyle={{ minWidth: 220 }}
        >
          <Button
            type="text"
            aria-label="Open account menu"
            style={{
              height: 44,
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 999,
            }}
          >
            <Avatar
              size={32}
              style={{ background: BRAND, fontWeight: 600, fontSize: 13 }}
            >
              {initials}
            </Avatar>

            {!isMobile && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 3,
                }}
              >
                <Text strong style={{ fontSize: 13, lineHeight: 1 }}>
                  {user.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 1,
                    color: token.colorTextSecondary,
                  }}
                >
                  {user.role}
                </Text>
              </div>
            )}

            <DownOutlined
              style={{ fontSize: 10, color: token.colorTextSecondary }}
            />
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
}

export default Navbar;
