import { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, Divider, Space, Alert, Card } from 'antd';
import { MailOutlined, LockOutlined, BookOutlined, SafetyOutlined, RocketOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginButton } from '../../components/auth';
import '../../styles/Auth.css';

const { Title, Text, Paragraph } = Typography;

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
      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <BookOutlined className="logo-icon" />
              <Title level={1} className="brand-title">EduManage</Title>
            </div>
            <Paragraph className="brand-subtitle">
              Nền tảng quản lý giáo dục thông minh
            </Paragraph>

            <div className="feature-list">
              <div className="feature-item">
                <RocketOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Hiệu quả cao</Text>
                  <Text className="feature-desc">Quản lý lớp học, khóa học dễ dàng</Text>
                </div>
              </div>
              <div className="feature-item">
                <SafetyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Bảo mật tuyệt đối</Text>
                  <Text className="feature-desc">Dữ liệu được mã hóa và bảo vệ</Text>
                </div>
              </div>
              <div className="feature-item">
                <BookOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Học tập linh hoạt</Text>
                  <Text className="feature-desc">Truy cập mọi lúc, mọi nơi</Text>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <Text className="copyright">© 2024 EduManage. All rights reserved.</Text>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-section">
          <Card className="auth-card">
            <div className="auth-header">
              <Title level={2} className="form-title">Chào mừng trở lại!</Title>
              <Text className="form-subtitle">
                Đăng nhập để tiếp tục quản lý học tập
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                closable
                onClose={() => setError('')}
                style={{ marginBottom: 24 }}
                showIcon
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
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  placeholder="example@email.com"
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Nhập mật khẩu của bạn"
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item>
                <div className="form-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="remember-checkbox">Ghi nhớ đăng nhập</Checkbox>
                  </Form.Item>
                  <Link to="/auth/forgot-password" className="forgot-link">
                    Quên mật khẩu?
                  </Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-button"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              <Divider className="divider-text">
                <Text type="secondary">Hoặc đăng nhập với</Text>
              </Divider>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <GoogleLoginButton block />
              </Space>

              <div className="signup-link">
                <Text>Chưa có tài khoản? </Text>
                <Link to="/register" className="signup-text">
                  Đăng ký ngay
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
