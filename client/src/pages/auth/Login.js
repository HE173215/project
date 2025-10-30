import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, Divider, Space, Alert, Row, Col } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginButton } from '../../components/auth';
import '../../styles/Auth.css';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.requireVerification) {
        navigate('/auth/verify-otp', { state: { email: values.email } });
      } else {
        setError(error.response?.data?.message || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <Title level={2}>Sign in</Title>
          <Text>
            Don't have an account?{' '}
            <Link to="/register">Sign up</Link>
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
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
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
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                  <Link to="/auth/forgot-password">Forgot password?</Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Log in
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
              <GoogleLoginButton block />
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Login;
