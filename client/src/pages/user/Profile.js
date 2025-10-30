import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Avatar, Typography, Space } from 'antd';
import { UserOutlined, PhoneOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import RoleTag from '../../components/common/RoleTag';

const { Content } = Layout;
const { Title } = Typography;

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateProfile(user._id, values);
      setEditing(false);
    } catch (error) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditing(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '50px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Thông tin cá nhân</Title>
                {!editing && (
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => setEditing(true)}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
            </div>

            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onFinish={onFinish}
              initialValues={{
                fullName: user?.fullName || '',
                phone: user?.phone || '',
                avatar: user?.avatar || ''
              }}
            >
              <Form.Item label="Username">
                <strong>{user?.username}</strong>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Không thể thay đổi
                </Typography.Text>
              </Form.Item>

              <Form.Item label="Email">
                <strong>{user?.email}</strong>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Không thể thay đổi
                </Typography.Text>
              </Form.Item>

              <Form.Item label="Họ và tên" name="fullName">
                {editing ? (
                  <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                ) : (
                  <strong>{user?.fullName || 'Chưa cập nhật'}</strong>
                )}
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phone">
                {editing ? (
                  <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                ) : (
                  <strong>{user?.phone || 'Chưa cập nhật'}</strong>
                )}
              </Form.Item>

              <Form.Item label="Avatar URL" name="avatar">
                {editing ? (
                  <Input placeholder="Nhập URL avatar" />
                ) : (
                  <strong>{user?.avatar || 'Chưa cập nhật'}</strong>
                )}
              </Form.Item>

              {editing && (
                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                  <Space>
                    <Button 
                      icon={<CloseOutlined />}
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={loading}
                    >
                      Lưu thay đổi
                    </Button>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>

          <Card title="Thông tin bổ sung" style={{ marginTop: 24 }}>
            <Form.Item label="Vai trò" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
              <RoleTag role={user?.role || 'student'} style={{ fontSize: 14, padding: '4px 12px' }} />
            </Form.Item>

            <Form.Item label="Trạng thái" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
              <Typography.Text strong>
                {user?.isVerified ? '✅ Đã xác thực' : '⚠️ Chưa xác thực'}
              </Typography.Text>
            </Form.Item>

            <Form.Item label="Ngày tạo" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
              <Typography.Text>
                {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleString('vi-VN')
                  : 'Chưa có thông tin'
                }
              </Typography.Text>
            </Form.Item>

            <Form.Item label="Đăng nhập lần cuối" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
              <Typography.Text>
                {user?.lastLogin 
                  ? new Date(user.lastLogin).toLocaleString('vi-VN')
                  : 'Chưa có thông tin'
                }
              </Typography.Text>
            </Form.Item>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Profile;
