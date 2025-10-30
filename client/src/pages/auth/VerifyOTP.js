import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const { Title, Text } = Typography;

const VerifyOTP = () => {
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
      // Error handled by context
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
      // Error handled by context
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <SafetyOutlined style={{ fontSize: 50, color: '#667eea', marginBottom: 16 }} />
          <Title level={2}>Xác thực OTP</Title>
          <Text>
            Mã OTP đã được gửi đến email<br />
            <strong>{email}</strong>
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label={<div style={{ textAlign: 'center', width: '100%' }}>Nhập mã OTP (6 số)</div>}
            help="Mã OTP có hiệu lực trong 10 phút"
          >
            <Input
              size="large"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setOtp(value);
                  setError('');
                }
              }}
              maxLength={6}
              style={{ 
                textAlign: 'center', 
                fontSize: 24, 
                letterSpacing: '10px',
                fontWeight: 'bold'
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} size="large">
              Xác thực
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text>Không nhận được mã?</Text>
          <br />
          {countdown > 0 ? (
            <Text type="secondary">Gửi lại sau {countdown}s</Text>
          ) : (
            <Button
              type="link"
              onClick={handleResend}
              loading={resending}
              disabled={countdown > 0}
            >
              Gửi lại OTP
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
