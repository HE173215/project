import React, { createContext, useState, useContext, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const EnrollmentContext = createContext();

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
};

export const EnrollmentProvider = ({ children }) => {
  const { api } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get all enrollments (Admin, Manager)
  const getAllEnrollments = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/enrollments', { params });
      setEnrollments(response.data.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải danh sách đăng ký';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Reassign enrollment to another class (Admin, Manager)
  const reassignEnrollment = useCallback(async (id, classId) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/reassign`, { classId });
      message.success('Cập nhật lớp học thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật lớp học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get my enrollments (Student)
  const getMyEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/enrollments/my-enrollments');
      setMyEnrollments(response.data.data);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải danh sách đăng ký của bạn';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get enrollment by ID
  const getEnrollmentById = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/enrollments/${id}`);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải thông tin đăng ký';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create enrollment (Student enroll)
  const createEnrollment = async (classId) => {
    setLoading(true);
    try {
      const response = await api.post('/enrollments', { classId });
      message.success('Đăng ký lớp học thành công! Vui lòng chờ phê duyệt.');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký lớp học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Approve enrollment (Admin, Manager)
  const approveEnrollment = async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/approve`);
      message.success('Phê duyệt thành công! Hãy tiến hành xếp lớp.');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Phê duyệt thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reject enrollment (Admin, Manager)
  const rejectEnrollment = async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/reject`);
      message.success('Từ chối đăng ký thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Từ chối thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Drop enrollment (Student, Admin, Manager)
  const dropEnrollment = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/drop`);
      message.success('Đã gửi yêu cầu hủy, vui lòng chờ phê duyệt.');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gửi yêu cầu hủy thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const approveDropRequest = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/drop/approve`);
      message.success('Đã phê duyệt yêu cầu hủy lớp.');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Phê duyệt yêu cầu hủy thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const rejectDropRequest = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/drop/reject`);
      message.success('Đã từ chối yêu cầu hủy lớp.');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Từ chối yêu cầu hủy thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Update grade (Admin, Manager, Lecturer)
  const updateGrade = async (id, gradeData) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/grade`, gradeData);
      message.success('Cập nhật điểm thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật điểm thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const autoAssignEnrollment = async (id) => {
    setLoading(true);
    try {
      const response = await api.patch(`/enrollments/${id}/auto-assign`);
      message.success('Xếp lớp tự động thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xếp lớp tự động thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    enrollments,
    myEnrollments,
    loading,
    getAllEnrollments,
    getMyEnrollments,
    getEnrollmentById,
    createEnrollment,
    approveEnrollment,
    rejectEnrollment,
    reassignEnrollment,
    autoAssignEnrollment,
    dropEnrollment,
    approveDropRequest,
    rejectDropRequest,
    updateGrade
  };

  return <EnrollmentContext.Provider value={value}>{children}</EnrollmentContext.Provider>;
};
