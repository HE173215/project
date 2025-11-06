import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { LockOutlined, SafetyOutlined, BookOutlined, KeyOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const { Title, Text, Paragraph } = Typography;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password');
    }
  }, [email, navigate]);

  const onFinish = async (values) => {
    setError('');
    setLoading(true);

    try {
      await resetPassword(email, values.otp, values.newPassword);
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
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
              Tạo mật khẩu mới để bảo vệ tài khoản của bạn
            </Paragraph>

            <div className="feature-list">
              <div className="feature-item">
                <SafetyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Bảo mật cao</Text>
                  <Text className="feature-desc">Mật khẩu được mã hóa an toàn</Text>
                </div>
              </div>
              <div className="feature-item">
                <KeyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Mật khẩu mạnh</Text>
                  <Text className="feature-desc">Tối thiểu 6 ký tự kết hợp</Text>
                </div>
              </div>
              <div className="feature-item">
                <CheckCircleOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Xác thực OTP</Text>
                  <Text className="feature-desc">Đảm bảo chính chủ thay đổi</Text>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <Text className="copyright">© 2024 EduManage. All rights reserved.</Text>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Password Form */}
        <div className="auth-form-section">
          <Card className="auth-card">
            <div className="auth-header">
              <div className="otp-icon-wrapper">
                <LockOutlined className="otp-icon" />
              </div>
              <Title level={2} className="form-title">Đặt lại mật khẩu</Title>
              <Text className="form-subtitle">
                Nhập mã OTP đã nhận và tạo mật khẩu mới
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
              name="resetPassword"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                label="Mã OTP"
                name="otp"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP!' },
                  { len: 6, message: 'Mã OTP phải có 6 số!' }
                ]}
              >
                <Input
                  prefix={<SafetyOutlined className="input-icon" />}
                  placeholder="Nhập mã OTP 6 số"
                  maxLength={6}
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Tối thiểu 6 ký tự"
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Nhập lại mật khẩu mới"
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
                  icon={<CheckCircleOutlined />}
                >
                  Đặt lại mật khẩu
                </Button>
              </Form.Item>

              <div className="form-footer" style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/auth/login" className="back-link">
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

export default ResetPassword;
