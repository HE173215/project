import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Typography, Space, Divider, Row, Col, Tag } from 'antd';
import { UserOutlined, PhoneOutlined, EditOutlined, SaveOutlined, CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CalendarOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import RoleTag from '../../components/common/RoleTag';

const { Title, Text } = Typography;

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
    <>
      <div style={{ padding: '24px 16px', backgroundColor: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Profile Header Card */}
          <Card
            style={{
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginBottom: '20px',
              overflow: 'hidden'
            }}
          >
            <Row justify="space-between" align="top" gutter={24} style={{ marginBottom: '24px' }}>
              {/* Left: Avatar & Basic Info */}
              <Col xs={24} sm={24} md={16}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Avatar
                    size={88}
                    icon={<UserOutlined />}
                    src={user?.avatar}
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      backgroundColor: '#1890ff',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div>
                      <Title level={3} style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
                        {user?.fullName || 'Người dùng'}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                        @{user?.username}
                      </Text>
                    </div>
                    <Space size={8} wrap>
                      <RoleTag role={user?.role || 'student'} />
                      {user?.isVerified ? (
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          style={{ fontSize: '12px' }}
                        >
                          Đã xác thực
                        </Tag>
                      ) : (
                        <Tag
                          icon={<ExclamationCircleOutlined />}
                          color="warning"
                          style={{ fontSize: '12px' }}
                        >
                          Chưa xác thực
                        </Tag>
                      )}
                    </Space>
                  </div>
                </div>
              </Col>

              {/* Right: Edit Button */}
              <Col xs={24} sm={24} md={8} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                {!editing && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(true)}
                    size="large"
                    style={{ width: '100%', maxWidth: '120px' }}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            {/* Form Section */}
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                fullName: user?.fullName || '',
                phone: user?.phone || '',
                avatar: user?.avatar || ''
              }}
            >
              <Row gutter={24}>
                {/* Left Column */}
                <Col xs={24} sm={12}>
                  {/* Username */}
                  <Form.Item label={<Text strong style={{ fontSize: '14px' }}>Username</Text>}>
                    <Input
                      value={user?.username}
                      disabled
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>

                  {/* Email */}
                  <Form.Item label={<Text strong style={{ fontSize: '14px' }}>Email</Text>}>
                    <Input
                      value={user?.email}
                      disabled
                      size="large"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>

                {/* Right Column */}
                <Col xs={24} sm={12}>
                  {/* Full Name */}
                  <Form.Item label={<Text strong style={{ fontSize: '14px' }}>Họ và tên</Text>} name="fullName">
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ và tên"
                      size="large"
                      disabled={!editing}
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>

                  {/* Phone */}
                  <Form.Item label={<Text strong style={{ fontSize: '14px' }}>Số điện thoại</Text>} name="phone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                      size="large"
                      disabled={!editing}
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Avatar URL */}
              <Form.Item label={<Text strong style={{ fontSize: '14px' }}>Avatar URL</Text>} name="avatar">
                <Input
                  placeholder="Nhập URL avatar"
                  size="large"
                  disabled={!editing}
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              {/* Action Buttons */}
              {editing && (
                <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                  <Space>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={handleCancel}
                      disabled={loading}
                      size="large"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={loading}
                      size="large"
                    >
                      Lưu thay đổi
                    </Button>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>

          {/* Additional Info Card */}
          <Card
            title={
              <Title level={4} style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Thông tin bổ sung
              </Title>
            }
            style={{
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <Row gutter={24}>
              {/* Created Date */}
              <Col xs={24} sm={12}>
                <div style={{ padding: '12px 0' }}>
                  <Text strong style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Ngày tạo
                  </Text>
                  <Space>
                    <CalendarOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                    <Text style={{ fontSize: '14px', color: '#000' }}>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                        : 'Chưa có thông tin'
                      }
                    </Text>
                  </Space>
                </div>
              </Col>

              {/* Last Login */}
              <Col xs={24} sm={12}>
                <div style={{ padding: '12px 0' }}>
                  <Text strong style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>
                    Đăng nhập lần cuối
                  </Text>
                  <Space>
                    <LoginOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
                    <Text style={{ fontSize: '14px', color: '#000' }}>
                      {user?.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                        : 'Chưa có thông tin'
                      }
                    </Text>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;
