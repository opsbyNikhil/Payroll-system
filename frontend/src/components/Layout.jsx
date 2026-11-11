import { Layout as AntLayout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const { Content } = AntLayout;

function Layout() {
  return (
    <AntLayout hasSider style={{ minHeight: "100vh" }}>
      <Sidebar />
      <AntLayout style={{ minWidth: 0 }}>
        <Navbar />
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
