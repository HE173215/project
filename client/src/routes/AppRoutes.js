import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOTP from '../pages/auth/VerifyOTP';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard';

// Courses
import CourseList from '../pages/courses/CourseList';

// Classes
import ClassList from '../pages/classes/ClassList';

// Teachers
import TeacherList from '../pages/teachers/TeacherList';

// Rooms
import RoomList from '../pages/rooms/RoomList';

// Schedules
import ManageScheduleList from '../pages/schedules/ManageScheduleList';

// Enrollments
import MyEnrollments from '../pages/enrollments/MyEnrollments';
import EnrollmentManagement from '../pages/enrollments/EnrollmentManagement';
import LecturerEnrollments from '../pages/enrollments/LecturerEnrollments';

// Notifications
import NotificationList from '../pages/notifications/NotificationList';

// Assessments
import { LecturerAssessment, StudentAssessment } from '../pages/assessment';

// User Management
import UserManagement from '../pages/admin/UserManagement';

// Manager
import PerformanceReport from '../pages/manager/PerformanceReport';

// Profile
import Profile from '../pages/user/Profile';

// Not Found
import NotFound from '../pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/verify-otp"
        element={
          <PublicRoute>
            <VerifyOTP />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes with MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - All authenticated users */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Courses - All roles */}
        <Route path="courses" element={<CourseList />} />

        {/* Classes - All roles */}
        <Route path="classes" element={<ClassList />} />

        {/* Teachers - Admin, Manager */}
        <Route
          path="teachers"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <TeacherList />
            </ProtectedRoute>
          }
        />

        {/* Rooms - All roles */}
        <Route path="rooms" element={<RoomList />} />

        {/* Schedules - All roles */}
        <Route path="schedules" element={<ManageScheduleList />} />

        {/* Enrollments */}
        <Route
          path="enrollments"
          element={
            <ProtectedRoute roles={['student']}>
              <MyEnrollments />
            </ProtectedRoute>
          }
        />
        <Route
          path="enrollments/manage"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <EnrollmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="enrollments/lecturer"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <LecturerEnrollments />
            </ProtectedRoute>
          }
        />

        {/* Notifications - All roles */}
        <Route path="notifications" element={<NotificationList />} />

        {/* Assessments */}
        <Route
          path="assessments/lecturer"
          element={
            <ProtectedRoute roles={['lecturer']}>
              <LecturerAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="assessments/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="assessments"
          element={
            user?.role === 'lecturer' ? (
              <LecturerAssessment />
            ) : (
              <StudentAssessment />
            )
          }
        />

        {/* Performance Report - Manager only */}
        <Route
          path="performance"
          element={
            <ProtectedRoute roles={['manager']}>
              <PerformanceReport />
            </ProtectedRoute>
          }
        />

        {/* User Management - Admin only */}
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Profile - All authenticated users */}
        <Route path="profile" element={<Profile />} />

        {/* Settings - All authenticated users */}
        <Route path="settings" element={<div>Settings Page (Coming Soon)</div>} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
