import { useState } from 'react';
import { Form, Input, Button, Typography, Divider, Space, Alert, Card, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, IdcardOutlined, BookOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginButton } from '../../components/auth';
import '../../styles/Auth.css';

const { Title, Text, Paragraph } = Typography;

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
      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <BookOutlined className="logo-icon" />
              <Title level={1} className="brand-title">EduManage</Title>
            </div>
            <Paragraph className="brand-subtitle">
              Tham gia cùng hàng ngàn học viên trên toàn quốc
            </Paragraph>

            <div className="feature-list">
              <div className="feature-item">
                <BookOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Khóa học đa dạng</Text>
                  <Text className="feature-desc">Hàng trăm khóa học chất lượng cao</Text>
                </div>
              </div>
              <div className="feature-item">
                <TeamOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Giảng viên chuyên nghiệp</Text>
                  <Text className="feature-desc">Đội ngũ giảng viên giàu kinh nghiệm</Text>
                </div>
              </div>
              <div className="feature-item">
                <SafetyOutlined className="feature-icon" />
                <div>
                  <Text strong className="feature-title">Chứng chỉ uy tín</Text>
                  <Text className="feature-desc">Được công nhận bởi các tổ chức</Text>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <Text className="copyright">© 2024 EduManage. All rights reserved.</Text>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="auth-form-section">
          <Card className="auth-card">
            <div className="auth-header">
              <Title level={2} className="form-title">Tạo tài khoản mới</Title>
              <Text className="form-subtitle">
                Bắt đầu hành trình học tập của bạn ngay hôm nay
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
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Tên đăng nhập"
                    name="username"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                      { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="input-icon" />}
                      placeholder="username123"
                      className="custom-input"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
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
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                  >
                    <Input
                      prefix={<IdcardOutlined className="input-icon" />}
                      placeholder="Nguyễn Văn A (Tùy chọn)"
                      className="custom-input"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="input-icon" />}
                      placeholder="0123456789 (Tùy chọn)"
                      className="custom-input"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
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
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Nhập lại mật khẩu"
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
                  Đăng ký
                </Button>
              </Form.Item>

              <Divider className="divider-text">
                <Text type="secondary">Hoặc đăng ký với</Text>
              </Divider>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <GoogleLoginButton text="signup_with" block />
              </Space>

              <div className="signup-link">
                <Text>Đã có tài khoản? </Text>
                <Link to="/login" className="signup-text">
                  Đăng nhập ngay
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
