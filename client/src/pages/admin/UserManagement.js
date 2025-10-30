import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Card,
  Typography,
  Avatar,
  Tooltip,
  Dropdown,
  Row,
  Col,
  Statistic,
  Divider,
  Empty,
  App
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownOutlined,
  TeamOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIG, getRoleLabel, getRoleColor } from '../../utils/roleUtils';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  const [editForm] = Form.useForm();
  const [addForm] = Form.useForm();
  const { message } = App.useApp();
  const { api, user: currentUser } = useAuth();

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete user
  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      message.success('Xóa người dùng thành công');
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa người dùng thất bại');
    }
  };

  // Toggle block user
  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      await api.patch(`/users/${userId}/block`);
      message.success(isBlocked ? 'Đã mở khóa người dùng' : 'Đã khóa người dùng');
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  // Change user role quickly
  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      message.success('Thay đổi vai trò thành công');
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thay đổi vai trò thất bại');
    }
  };

  // Open edit modal
  const handleEdit = (user) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isBlocked: user.isBlocked
    });
    setEditModalVisible(true);
  };

  // Submit edit
  const handleEditSubmit = async (values) => {
    try {
      await api.put(`/users/${selectedUser._id}`, {
        fullName: values.fullName,
        phone: values.phone
      });
      
      // Update role if changed
      if (values.role !== selectedUser.role) {
        await api.patch(`/users/${selectedUser._id}/role`, { role: values.role });
      }
      
      // Update block status if changed
      if (values.isBlocked !== selectedUser.isBlocked) {
        await api.patch(`/users/${selectedUser._id}/block`);
      }
      
      message.success('Cập nhật thông tin thành công');
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  // Submit add user
  const handleAddSubmit = async (values) => {
    try {
      await api.post('/users/create', values);
      message.success('Thêm người dùng thành công');
      setAddModalVisible(false);
      addForm.resetFields();
      loadUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Thêm người dùng thất bại');
    }
  };

  // Filter users
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => !user.isBlocked && user.isVerified).length;
  const blockedUsers = users.filter(user => user.isBlocked).length;
  const unverifiedUsers = users.filter(user => !user.isVerified).length;

  // Table columns
  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <Avatar 
          size={40} 
          src={avatar} 
          icon={<UserOutlined />}
          style={{ backgroundColor: record.isBlocked ? '#ff4d4f' : '#1890ff' }}
        />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text) => text || <span style={{ color: '#999' }}>Chưa cập nhật</span>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || <span style={{ color: '#999' }}>Chưa cập nhật</span>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Student', value: 'student' },
        { text: 'Lecturer', value: 'lecturer' },
        { text: 'Manager', value: 'manager' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role, record) => {
        const roleMenuItems = Object.keys(ROLE_CONFIG)
          .filter(key => key !== role)
          .map(key => ({
            key,
            label: ROLE_CONFIG[key].label
          }));
        
        const handleMenuClick = ({ key }) => {
          Modal.confirm({
            title: 'Xác nhận thay đổi vai trò',
            content: `Bạn có chắc muốn thay đổi vai trò của ${record.username} thành ${getRoleLabel(key)}?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: () => handleChangeRole(record._id, key)
          });
        };
        
        // Disable role change for current user
        const isCurrentUser = record._id === currentUser?._id;
        
        return (
          <Dropdown
            menu={{
              items: roleMenuItems,
              onClick: handleMenuClick
            }}
            trigger={['click']}
            disabled={isCurrentUser}
          >
            <Tag 
              color={getRoleColor(role)} 
              style={{ cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
            >
              {getRoleLabel(role)} <DownOutlined />
            </Tag>
          </Dropdown>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Bị khóa', value: 'blocked' },
        { text: 'Chưa xác thực', value: 'unverified' },
      ],
      onFilter: (value, record) => {
        if (value === 'blocked') return record.isBlocked;
        if (value === 'unverified') return !record.isVerified;
        return !record.isBlocked && record.isVerified;
      },
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.isBlocked && <Tag color="red">Bị khóa</Tag>}
          {!record.isVerified && <Tag color="orange">Chưa xác thực</Tag>}
          {!record.isBlocked && record.isVerified && <Tag color="green">Hoạt động</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.isBlocked ? 'Mở khóa' : 'Khóa'}>
            <Button
              type={record.isBlocked ? 'default' : 'danger'}
              icon={record.isBlocked ? <UnlockOutlined /> : <LockOutlined />}
              size="small"
              onClick={() => handleToggleBlock(record._id, record.isBlocked)}
              disabled={record._id === currentUser?._id}
            />
          </Tooltip>
          
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            disabled={record._id === currentUser?._id}
          >
            <Tooltip title="Xóa">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={record._id === currentUser?._id}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 0, color: '#1890ff' }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Quản lý người dùng
          </Title>
          <Divider style={{ margin: '12px 0 24px 0' }} />
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#666' }}>Tổng người dùng</span>}
                value={totalUsers}
                valueStyle={{ color: '#1890ff', fontSize: '28px' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#666' }}>Đang hoạt động</span>}
                value={activeUsers}
                valueStyle={{ color: '#52c41a', fontSize: '28px' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#666' }}>Đã khóa</span>}
                value={blockedUsers}
                valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#666' }}>Chưa xác thực</span>}
                value={unverifiedUsers}
                valueStyle={{ color: '#faad14', fontSize: '28px' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content Card */}
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: 'none'
          }}
        >
          {/* Header with Search and Actions */}
          <div style={{
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={4} style={{ margin: 0, color: '#262626' }}>
                Danh sách người dùng
              </Title>
              <Tag color="blue" style={{ fontSize: '12px' }}>
                {filteredUsers.length} / {totalUsers}
              </Tag>
            </div>

            <Space wrap>
              <Input
                placeholder="Tìm kiếm theo username, email hoặc tên..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280, borderRadius: 6 }}
                allowClear
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={loadUsers}
                loading={loading}
                style={{ borderRadius: 6 }}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
                style={{ borderRadius: 6, boxShadow: '0 2px 4px rgba(24,144,255,0.3)' }}
              >
                Thêm người dùng
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="_id"
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có dữ liệu người dùng"
                />
              )
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]}-${range[1]} của ${total} người dùng`,
              style: { marginTop: 16 }
            }}
            style={{
              borderRadius: 8,
              overflow: 'hidden'
            }}
          />
        </Card>

        {/* Edit Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EditOutlined style={{ color: '#1890ff' }} />
              <span>Chỉnh sửa người dùng</span>
              <Tag color="blue">{selectedUser?.username}</Tag>
            </div>
          }
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          width={600}
          destroyOnHidden
          style={{ borderRadius: 12 }}
        >
          <Divider style={{ margin: '16px 0' }} />
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
            style={{ padding: '8px 0' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                  name="fullName"
                >
                  <Input
                    placeholder="Nhập họ và tên đầy đủ"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                  name="phone"
                  rules={[
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' }
                  ]}
                >
                  <Input
                    placeholder="VD: 0987654321"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Vai trò</span>}
                  name="role"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                >
                  <Select
                    placeholder="Chọn vai trò"
                    style={{ borderRadius: 6 }}
                  >
                    {Object.keys(ROLE_CONFIG).map(key => (
                      <Option key={key} value={key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag color={getRoleColor(key)} size="small">
                            {ROLE_CONFIG[key].label}
                          </Tag>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {ROLE_CONFIG[key].description}
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Trạng thái tài khoản</span>}
                  name="isBlocked"
                  valuePropName="checked"
                >
                  <Select
                    placeholder="Chọn trạng thái"
                    style={{ borderRadius: 6 }}
                  >
                    <Option value={false}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Hoạt động</span>
                      </div>
                    </Option>
                    <Option value={true}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        <span>Đã khóa</span>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0 16px 0' }} />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => setEditModalVisible(false)}
                  style={{ borderRadius: 6 }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    borderRadius: 6,
                    boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                  }}
                >
                  <CheckCircleOutlined />
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserAddOutlined style={{ color: '#52c41a' }} />
              <span>Thêm người dùng mới</span>
            </div>
          }
          open={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            addForm.resetFields();
          }}
          footer={null}
          width={700}
          destroyOnHidden
          style={{ borderRadius: 12 }}
        >
          <Divider style={{ margin: '16px 0' }} />
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAddSubmit}
            style={{ padding: '8px 0' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Username</span>}
                  name="username"
                  rules={[
                    { required: true, message: 'Vui lòng nhập username' },
                    { min: 3, message: 'Username phải có ít nhất 3 ký tự' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username chỉ chứa chữ cái, số và dấu gạch dưới' }
                  ]}
                >
                  <Input
                    placeholder="Nhập username"
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Email</span>}
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input
                    placeholder="Nhập địa chỉ email"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
                  name="password"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  ]}
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                  name="fullName"
                >
                  <Input
                    placeholder="Nhập họ và tên đầy đủ"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                  name="phone"
                  rules={[
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' }
                  ]}
                >
                  <Input
                    placeholder="VD: 0987654321"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Vai trò</span>}
                  name="role"
                  initialValue="student"
                >
                  <Select
                    placeholder="Chọn vai trò"
                    style={{ borderRadius: 6 }}
                  >
                    {Object.keys(ROLE_CONFIG).map(key => (
                      <Option key={key} value={key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag color={getRoleColor(key)} size="small">
                            {ROLE_CONFIG[key].label}
                          </Tag>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {ROLE_CONFIG[key].description}
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0 16px 0' }} />

            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: 500, color: '#52c41a' }}>Lưu ý</span>
              </div>
              <div style={{ marginTop: 8, color: '#666', fontSize: '13px' }}>
                • Người dùng mới sẽ được tạo với trạng thái chưa xác thực email<br/>
                • Họ cần xác thực email trước khi có thể đăng nhập<br/>
                • Admin có thể thay đổi vai trò và trạng thái tài khoản sau
              </div>
            </div>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => {
                    setAddModalVisible(false);
                    addForm.resetFields();
                  }}
                  style={{ borderRadius: 6 }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    borderRadius: 6,
                    boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                  }}
                >
                  <UserAddOutlined />
                  Thêm người dùng
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserManagement;
