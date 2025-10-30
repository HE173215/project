import React, { useState } from 'react';
import { Form, Input, Button, Typography, Divider, Space, Alert, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginButton } from '../../components/auth';
import '../../styles/Auth.css';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    
    try {
      const { username, email, password, fullName, phone } = values;
      await register({ username, email, password, fullName, phone });
      navigate('/auth/verify-otp', { state: { email: values.email } });
    } catch (error) {
      setError(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <Title level={2}>Sign up</Title>
          <Text>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </Text>
        </div>

        <Row gutter={[48, 48]} justify="center" className="auth-row">
          {/* Form Column */}
          <Col xs={24} lg={10}>
            {error && (
              <Alert
                message={error}
                type="error"
                closable
                onClose={() => setError('')}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Please input your username!' },
                  { min: 3, message: 'Username must be at least 3 characters!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Username"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                />
              </Form.Item>

              <Form.Item
                name="fullName"
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="Full Name (Optional)"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                rules={[
                  { pattern: /^[0-9]{10,11}$/, message: 'Please enter a valid phone number!' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Phone (Optional)"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm Password"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Sign up
                </Button>
              </Form.Item>
            </Form>
          </Col>

          {/* Divider Column */}
          <Col xs={0} lg={2} className="auth-divider">
            <Divider type="vertical" style={{ height: '100%' }} />
            <Text type="secondary">or</Text>
            <Divider type="vertical" style={{ height: '100%' }} />
          </Col>

          {/* Social Login Column */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className="google-login-wrapper">
                <GoogleLoginButton text="signup_with" />
              </div>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Register;
