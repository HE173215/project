import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert, Card } from 'antd';
import { SafetyOutlined, BookOutlined, MailOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const { Title, Text, Paragraph } = Typography;

const VerifyOTP = () => {
  const [form] = Form.useForm();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/auth/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async () => {
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendOTP(email);
      setCountdown(60);
      setOtp('');
    } catch (error) {
      setError(error.response?.data?.message || 'Gửi lại OTP thất bại');
    } finally {
      setResending(false);
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
              Xác thực tài khoản để truy cập đầy đủ tính năng
            </Paragraph>

            <div className="feature-list">
              <div className="feature-item">
                <SafetyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Bảo mật 2 lớp</Text>
                  <Text className="feature-desc">Xác thực qua email để bảo vệ tài khoản</Text>
                </div>
              </div>
              <div className="feature-item">
                <MailOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Kiểm tra email</Text>
                  <Text className="feature-desc">Mã OTP đã được gửi đến hộp thư</Text>
                </div>
              </div>
              <div className="feature-item">
                <ClockCircleOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Hiệu lực 10 phút</Text>
                  <Text className="feature-desc">Nhập mã trước khi hết thời gian</Text>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <Text className="copyright">© 2024 EduManage. All rights reserved.</Text>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Verification Form */}
        <div className="auth-form-section">
          <Card className="auth-card">
            <div className="auth-header">
              <div className="otp-icon-wrapper">
                <SafetyOutlined className="otp-icon" />
              </div>
              <Title level={2} className="form-title">Xác thực OTP</Title>
              <Text className="form-subtitle">
                Mã OTP đã được gửi đến email
              </Text>
              <Text strong className="email-highlight">
                {email}
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
              name="verifyOTP"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label={<div style={{ textAlign: 'center', width: '100%', fontSize: '15px' }}>Nhập mã OTP (6 số)</div>}
                help={<div style={{ textAlign: 'center' }}>Mã OTP có hiệu lực trong 10 phút</div>}
              >
                <Input
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setOtp(value);
                      setError('');
                    }
                  }}
                  maxLength={6}
                  placeholder="000000"
                  className="otp-input"
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
                  Xác thực
                </Button>
              </Form.Item>

              <div className="resend-section">
                <Text>Không nhận được mã?</Text>
                {countdown > 0 ? (
                  <Text type="secondary" className="countdown-text">
                    Gửi lại sau <strong>{countdown}s</strong>
                  </Text>
                ) : (
                  <Button
                    type="link"
                    onClick={handleResend}
                    loading={resending}
                    disabled={countdown > 0}
                    className="resend-button"
                  >
                    Gửi lại OTP
                  </Button>
                )}
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
