import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance with credentials (cookies) - created outside component
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // IMPORTANT: Send cookies with requests
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data
  const loadUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      // Chỉ log error nếu không phải 401 (unauthorized)
      if (error.response?.status !== 401) {
        console.error('Load user error:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Handle 401 errors globally
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Skip error handling for auth endpoints
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                              error.config?.url?.includes('/auth/register') ||
                              error.config?.url?.includes('/auth/verify-otp') ||
                              error.config?.url?.includes('/auth/google') ||
                              error.config?.url?.includes('/auth/logout') ||
                              error.config?.url?.includes('/auth/me');
        
        // Only show session expired for 401 on protected routes when user is logged in
        if (error.response?.status === 401 && !isAuthEndpoint && user) {
          setUser(null);
          message.error('Phiên đăng nhập đã hết hạn');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [user]);

  // Register
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      message.success(response.data.message);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { user: userData } = response.data.data;
      
      // Cookie is set automatically by backend
      setUser(userData);
      
      message.success('Xác thực thành công!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xác thực thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      message.success('OTP mới đã được gửi đến email');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gửi OTP thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData } = response.data.data;
      
      // Cookie is set automatically by backend
      setUser(userData);
      
      message.success('Đăng nhập thành công!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call backend to clear cookie
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors - just log them
      console.error('Logout error:', error);
    } finally {
      // Always clear user and show message
      setUser(null);
      message.success('Đã đăng xuất thành công');
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      message.success('OTP đã được gửi đến email');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gửi OTP thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      message.success('Đổi mật khẩu thành công!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Update Profile
  const updateProfile = async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      setUser(response.data.data);
      message.success('Cập nhật thông tin thành công!');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    api,
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
