import { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { MailOutlined, ArrowLeftOutlined, BookOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const { Title, Text, Paragraph } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    try {
      await forgotPassword(values.email);
      navigate('/auth/reset-password', { state: { email: values.email } });
    } catch (error) {
      setError(error.response?.data?.message || 'Gửi OTP thất bại');
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
              Khôi phục quyền truy cập tài khoản của bạn
            </Paragraph>

            <div className="feature-list">
              <div className="feature-item">
                <SafetyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Bảo mật cao</Text>
                  <Text className="feature-desc">Mã OTP được mã hóa và bảo vệ</Text>
                </div>
              </div>
              <div className="feature-item">
                <ClockCircleOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Nhanh chóng</Text>
                  <Text className="feature-desc">Nhận mã OTP ngay lập tức</Text>
                </div>
              </div>
              <div className="feature-item">
                <MailOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Qua email</Text>
                  <Text className="feature-desc">Mã được gửi đến email đã đăng ký</Text>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <Text className="copyright">© 2024 EduManage. All rights reserved.</Text>
            </div>
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <div className="auth-form-section">
          <Card className="auth-card">
            <div className="auth-header">
              <Title level={2} className="form-title">Quên mật khẩu?</Title>
              <Text className="form-subtitle">
                Đừng lo lắng! Nhập email và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu
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
              name="forgotPassword"
              onFinish={handleSubmit}
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

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-button"
                >
                  Gửi mã OTP
                </Button>
              </Form.Item>

              <div className="signup-link">
                <Link to="/login" className="back-link">
                  <ArrowLeftOutlined style={{ marginRight: 8 }} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
