import React, { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  HomeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount, getUnreadCount } = useNotification();

  useEffect(() => {
    getUnreadCount();
    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [getUnreadCount]);

  // Menu items theo role
  const getMenuItems = () => {
    const items = [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        roles: ["admin"],
      },
      {
        key: "/courses",
        icon: <BookOutlined />,
        label: "Khóa học",
        roles: ["admin", "manager", "lecturer", "student"],
      },
      {
        key: "/classes",
        icon: <TeamOutlined />,
        label: "Lớp học",
        roles: ["admin", "manager"], // ✅ chỉ hiển thị khi role là admin hoặc manager
      },
      {
        key: "/teachers",
        icon: <UserOutlined />,
        label: "Giảng viên",
        roles: ["admin", "manager"],
      },
      {
        key: "/rooms",
        icon: <HomeOutlined />,
        label: "Phòng học",
        roles: ["admin", "manager", "lecturer", "student"],
      },
      {
        key: "/schedules",
        icon: <CalendarOutlined />,
        label: "Lịch học",
        roles: ["admin", "manager", "lecturer", "student"],
      },
      {
        key:
          user?.role === "student"
            ? "/enrollments"
            : user?.role === "lecturer"
            ? "/enrollments/lecturer"
            : "/enrollments/manage",
        icon: <FileTextOutlined />,
        label:
          user?.role === "student"
            ? "Lớp học của tôi"
            : user?.role === "lecturer"
            ? "Lớp giảng dạy"
            : "Quản lý đăng ký",
        roles: ["admin", "manager", "student", "lecturer"],
      },
      {
        key: "/assessments",
        icon: <CheckSquareOutlined />,
        label: "Bài tập",
        roles: ["admin", "manager", "lecturer", "student"],
      },
      {
        key: "/notifications",
        icon: <BellOutlined />,
        label: (
          <span>
            Thông báo
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                offset={[10, 0]}
                style={{ marginLeft: 8 }}
              />
            )}
          </span>
        ),
        roles: ["admin", "manager", "lecturer", "student"],
      },
      {
        key: "/performance",
        icon: <BarChartOutlined />,
        label: "Báo cáo hiệu suất",
        roles: ["manager"],
      },
      {
        key: "/users",
        icon: <UserOutlined />,
        label: "Quản lý người dùng",
        roles: ["admin"],
      },
    ];

    // Filter theo role
    return items
      .filter((item) => item.roles.includes(user?.role))
      .map(({ roles, ...item }) => item);
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: collapsed ? 16 : 20,
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {collapsed ? "LMS" : "Learning MS"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout
        style={{ marginLeft: collapsed ? 80 : 200, transition: "all 0.2s" }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: "trigger",
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 18, cursor: "pointer" },
              }
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge count={unreadCount} offset={[-5, 5]}>
              <BellOutlined
                style={{ fontSize: 20, cursor: "pointer" }}
                onClick={() => navigate("/notifications")}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Avatar src={user?.avatar} icon={<UserOutlined />} />
                <span>{user?.fullName || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: 24,
            background: "#fff",
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
