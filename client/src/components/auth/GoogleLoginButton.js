import React, { useState } from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { message } from 'antd';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ block = false }) => {
  const navigate = useNavigate();
  const { api, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Gửi access token đến backend
        const response = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });

        // Cookie is set automatically by backend
        
        // Load user data to update context
        await loadUser();
        
        // Show success message
        message.success(response.data.message);

        // Redirect to dashboard
        navigate('/dashboard');

      } catch (error) {
        console.error('Google login error:', error);
        const errorMsg = error.response?.data?.message || 'Đăng nhập Google thất bại';
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      message.error('Đăng nhập Google thất bại');
      setLoading(false);
    },
  });

  return (
    <Button
      type="default"
      size="large"
      icon={<GoogleOutlined />}
      onClick={() => handleGoogleLogin()}
      loading={loading}
      block={block}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      Đăng nhập với Google
    </Button>
  );
};

export default GoogleLoginButton;
