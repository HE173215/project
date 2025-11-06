/**
 * Application Route Paths
 * Centralized route path definitions for easy maintenance
 */

// Auth Routes
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
};

// User Routes
export const USER_ROUTES = {
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
};

// Admin Routes
export const ADMIN_ROUTES = {
  USERS: '/admin/users',
  // Add more admin routes here
  // SETTINGS: '/admin/settings',
  // REPORTS: '/admin/reports',
};

// Public Routes
export const PUBLIC_ROUTES = {
  HOME: '/',
  NOT_FOUND: '*',
};

// Helper function to check if route is admin route
export const isAdminRoute = (path) => {
  return path.startsWith('/admin');
};

// Helper function to check if route is auth route
export const isAuthRoute = (path) => {
  return path.startsWith('/auth');
};
