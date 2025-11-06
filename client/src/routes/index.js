import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route Components
import PrivateRoute from '../components/routes/PrivateRoute';
import PublicRoute from '../components/routes/PublicRoute';
import AdminRoute from '../components/routes/AdminRoute';

// Auth Pages
import { 
  Login, 
  Register, 
  VerifyOTP, 
  ForgotPassword, 
  ResetPassword 
} from '../pages/auth';

// User Pages
import { Dashboard, Profile } from '../pages/user';

// Admin Pages
import UserManagement from '../pages/admin/UserManagement';

// Other Pages
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      
      {/* Auth Routes */}
      <Route path="/auth/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/auth/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      <Route path="/auth/verify-otp" element={<VerifyOTP />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      
      {/* Legacy redirects for backward compatibility */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      <Route path="/verify-otp" element={<Navigate to="/auth/verify-otp" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
      <Route path="/reset-password" element={<Navigate to="/auth/reset-password" replace />} />
      
      {/* ==================== PRIVATE ROUTES (USER) ==================== */}
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      
      {/* ==================== ADMIN ROUTES ==================== */}
      
      <Route path="/admin/users" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />
      
      {/* ==================== REDIRECTS & 404 ==================== */}
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
