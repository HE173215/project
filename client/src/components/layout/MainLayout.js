import { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Typography } from "antd";
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
  ReadOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import "../../styles/MainLayout.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

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
        roles: ["admin", "manager"],
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

  // Get role display name
  const getRoleDisplay = () => {
    const roleMap = {
      admin: "Quản trị viên",
      manager: "Quản lý",
      lecturer: "Giảng viên",
      student: "Học viên",
    };
    return roleMap[user?.role] || user?.role;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="main-sider"
        width={260}
        collapsedWidth={80}
      >
        {/* Logo Section */}
        <div className={`logo-section ${collapsed ? "collapsed" : ""}`}>
          <div className="logo-icon">
            <ReadOutlined />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">EduManage</div>
              <div className="logo-subtitle">Learning Management</div>
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          className="main-menu"
        />

        {/* User Info in Sidebar (when expanded) */}
        {!collapsed && (
          <div className="sidebar-user-info">
            <Avatar
              size={48}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="sidebar-avatar"
            />
            <div className="sidebar-user-details">
              <Text strong className="sidebar-username">
                {user?.fullName || user?.username}
              </Text>
              <Text className="sidebar-role">
                {getRoleDisplay()}
              </Text>
            </div>
          </div>
        )}
      </Sider>

      <Layout className="site-layout">
        {/* Header */}
        <Header className="main-header">
          <div className="header-left">
            <div
              className="trigger-button"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <div className="header-breadcrumb">
              <Text className="current-page">
                {getMenuItems().find(item => item.key === location.pathname)?.label || "Dashboard"}
              </Text>
            </div>
          </div>

          <div className="header-right">
            {/* Notifications */}
            <div className="header-notification" onClick={() => navigate("/notifications")}>
              <Badge count={unreadCount} offset={[-3, 3]}>
                <div className="notification-icon">
                  <BellOutlined />
                </div>
              </Badge>
            </div>

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="header-user">
                <Avatar src={user?.avatar} icon={<UserOutlined />} size={40} />
                <div className="header-user-info">
                  <Text strong className="header-username">
                    {user?.fullName || user?.username}
                  </Text>
                  <Text className="header-role">
                    {getRoleDisplay()}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
