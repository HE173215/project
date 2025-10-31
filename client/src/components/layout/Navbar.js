import { Layout, Dropdown, Avatar, Space, Badge, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, SettingOutlined, TeamOutlined, ReadOutlined, BellOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navbar.css';

const { Header } = Layout;
const { Text } = Typography;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getRoleDisplay = () => {
    const roleMap = {
      admin: "Quản trị viên",
      manager: "Quản lý",
      lecturer: "Giảng viên",
      student: "Học viên",
    };
    return roleMap[user?.role] || user?.role;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Thông tin cá nhân</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Cài đặt</Link>,
    },
    ...(user?.role === 'admin' ? [{
      key: 'admin',
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">Quản lý người dùng</Link>,
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header className="custom-navbar">
      {/* Logo/Brand Section */}
      <Link to="/dashboard" className="navbar-brand">
        <div className="brand-icon">
          <ReadOutlined />
        </div>
        <div className="brand-text">
          <div className="brand-title">EduManage</div>
          <div className="brand-subtitle">Learning System</div>
        </div>
      </Link>

      {/* Right Section */}
      <div className="navbar-right">
        {/* Dashboard Link */}
        <Link to="/dashboard" className="navbar-link">
          <DashboardOutlined className="link-icon" />
          <span>Dashboard</span>
        </Link>

        {/* Notifications */}
        <div className="navbar-notification">
          <Badge count={0} offset={[-5, 5]}>
            <BellOutlined className="notification-icon" />
          </Badge>
        </div>

        {/* User Dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="navbar-user">
            <Avatar
              src={user?.avatar}
              icon={<UserOutlined />}
              size={40}
              className="user-avatar"
            />
            <div className="user-info">
              <Text strong className="user-name">
                {user?.fullName || user?.username}
              </Text>
              <Text className="user-role">
                {getRoleDisplay()}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navbar;
