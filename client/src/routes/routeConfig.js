/**
 * Route Configuration
 * Centralized route definitions with metadata
 */

import { 
  Login, 
  Register, 
  VerifyOTP, 
  ForgotPassword, 
  ResetPassword 
} from '../pages/auth';
import { Dashboard, Profile } from '../pages/user';
import UserManagement from '../pages/admin/UserManagement';
import NotFound from '../pages/NotFound';

/**
 * Route Types:
 * - public: Accessible without authentication
 * - private: Requires authentication
 * - admin: Requires admin role
 */

export const routeConfig = [
  // ==================== AUTH ROUTES ====================
  {
    path: '/auth/login',
    component: Login,
    type: 'public',
    title: 'Đăng nhập',
  },
  {
    path: '/auth/register',
    component: Register,
    type: 'public',
    title: 'Đăng ký',
  },
  {
    path: '/auth/verify-otp',
    component: VerifyOTP,
    type: 'public',
    title: 'Xác thực OTP',
  },
  {
    path: '/auth/forgot-password',
    component: ForgotPassword,
    type: 'public',
    title: 'Quên mật khẩu',
  },
  {
    path: '/auth/reset-password',
    component: ResetPassword,
    type: 'public',
    title: 'Đặt lại mật khẩu',
  },

  // ==================== USER ROUTES ====================
  {
    path: '/dashboard',
    component: Dashboard,
    type: 'private',
    title: 'Dashboard',
  },
  {
    path: '/profile',
    component: Profile,
    type: 'private',
    title: 'Thông tin cá nhân',
  },

  // ==================== ADMIN ROUTES ====================
  {
    path: '/admin/users',
    component: UserManagement,
    type: 'admin',
    title: 'Quản lý người dùng',
  },
  // Add more admin routes here
  // {
  //   path: '/admin/settings',
  //   component: Settings,
  //   type: 'admin',
  //   title: 'Cài đặt hệ thống',
  // },

  // ==================== OTHER ROUTES ====================
  {
    path: '*',
    component: NotFound,
    type: 'public',
    title: 'Không tìm thấy trang',
  },
];

// Legacy route redirects
export const legacyRedirects = [
  { from: '/login', to: '/auth/login' },
  { from: '/register', to: '/auth/register' },
  { from: '/verify-otp', to: '/auth/verify-otp' },
  { from: '/forgot-password', to: '/auth/forgot-password' },
  { from: '/reset-password', to: '/auth/reset-password' },
];

// Get routes by type
export const getRoutesByType = (type) => {
  return routeConfig.filter(route => route.type === type);
};

// Get route by path
export const getRouteByPath = (path) => {
  return routeConfig.find(route => route.path === path);
};
