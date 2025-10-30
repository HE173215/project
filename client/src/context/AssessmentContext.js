import React, { createContext, useState, useContext } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const AssessmentContext = createContext();

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

export const AssessmentProvider = ({ children }) => {
  const { api } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [myAssessments, setMyAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get all assessments (Admin, Manager, Lecturer)
  const getAllAssessments = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/assessments', { params });
      setAssessments(response.data.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải danh sách bài tập';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get my assessments (Student)
  const getMyAssessments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assessments/my-assessments');
      setMyAssessments(response.data.data);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải danh sách bài tập của bạn';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get assessment by ID
  const getAssessmentById = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/assessments/${id}`);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải thông tin bài tập';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create assessment (Admin, Manager, Lecturer)
  const createAssessment = async (assessmentData) => {
    setLoading(true);
    try {
      const response = await api.post('/assessments', assessmentData);
      message.success('Tạo bài tập thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Tạo bài tập thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update assessment (Admin, Manager, Lecturer)
  const updateAssessment = async (id, assessmentData) => {
    setLoading(true);
    try {
      const response = await api.put(`/assessments/${id}`, assessmentData);
      message.success('Cập nhật bài tập thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật bài tập thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Submit assessment (Student)
  const submitAssessment = async (id, attachments = []) => {
    setLoading(true);
    try {
      const response = await api.patch(`/assessments/${id}/submit`, { attachments });
      message.success('Nộp bài thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Nộp bài thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Grade assessment (Admin, Manager, Lecturer)
  const gradeAssessment = async (id, score, feedback) => {
    setLoading(true);
    try {
      const response = await api.patch(`/assessments/${id}/grade`, { score, feedback });
      message.success('Chấm điểm thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Chấm điểm thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete assessment (Admin, Manager)
  const deleteAssessment = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/assessments/${id}`);
      message.success('Xóa bài tập thành công!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xóa bài tập thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get enrollment average
  const getEnrollmentAverage = async (enrollmentId) => {
    setLoading(true);
    try {
      const response = await api.get(`/assessments/enrollment/${enrollmentId}/average`);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tính điểm trung bình';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    assessments,
    myAssessments,
    loading,
    getAllAssessments,
    getMyAssessments,
    getAssessmentById,
    createAssessment,
    updateAssessment,
    submitAssessment,
    gradeAssessment,
    deleteAssessment,
    getEnrollmentAverage
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};
