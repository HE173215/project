import React, { createContext, useState, useContext, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const CourseContext = createContext(null);

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourse must be used within a CourseProvider');
  return context;
};

export const CourseProvider = ({ children }) => {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== Helper =====
  const handleError = (error, defaultMsg) => {
    const msg = error.response?.data?.message || defaultMsg;
    message.error(msg);
    console.error(msg);
  };

  // ===== CRUD =====

  const getAllCourses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/courses', { params });
      setCourses(res.data.data || []);
      return res.data.data;
    } catch (err) {
      handleError(err, 'Không thể tải danh sách khóa học');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getCourseById = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/${id}`);
      return res.data.data;
    } catch (err) {
      handleError(err, 'Không thể tải thông tin khóa học');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createCourse = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/courses', data);
      setCourses((prev) => [...prev, res.data.data]);
      message.success('Tạo khóa học thành công!');
      return res.data.data;
    } catch (err) {
      handleError(err, 'Tạo khóa học thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateCourse = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const res = await api.put(`/courses/${id}`, data);
      setCourses((prev) =>
        prev.map((c) => (c._id === id ? res.data.data : c))
      );
      message.success('Cập nhật khóa học thành công!');
      return res.data.data;
    } catch (err) {
      handleError(err, 'Cập nhật khóa học thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const deleteCourse = useCallback(async (id) => {
    setLoading(true);
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      message.success('Xóa khóa học thành công!');
    } catch (err) {
      handleError(err, 'Xóa khóa học thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // ===== Context value =====
  const value = {
    courses,
    loading,
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};
