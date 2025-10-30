import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const ClassContext = createContext();

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};

export const ClassProvider = ({ children }) => {
  const { api, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);

  const fetchTeacherProfile = useCallback(async () => {
    if (!user?._id) return null;
    try {
      const response = await api.get(`/teachers/user/${user._id}`);
      setTeacherProfile(response.data.data);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        setTeacherProfile(null);
        message.warning('Bạn chưa được gán hồ sơ giảng viên hoặc chưa được phân lớp.');
      } else {
        const errorMsg = error.response?.data?.message || 'Không thể tải thông tin giảng viên';
        message.error(errorMsg);
      }
      return null;
    }
  }, [api, user]);

  useEffect(() => {
    if (user?.role === 'lecturer') {
      fetchTeacherProfile();
    } else {
      setTeacherProfile(null);
    }
  }, [user, fetchTeacherProfile]);

  // Lấy tất cả lớp học
  const getAllClasses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      let queryParams = params;

      if (user?.role === 'lecturer') {
        let teacherId = teacherProfile?._id;
        if (!teacherId) {
          const profile = await fetchTeacherProfile();
          teacherId = profile?._id;
        }

        if (!teacherId) {
          setClasses([]);
          setLoading(false);
          return [];
        }

        queryParams = { ...params, teacher: teacherId };
      }

      const response = await api.get('/classes', { params: queryParams });
      setClasses(response.data.data);
      setLoading(false);
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Không thể tải danh sách lớp học';
      message.error(errorMsg);
      throw error;
    }
  }, [api, user, teacherProfile, fetchTeacherProfile]);

  // Lấy thông tin lớp theo ID
  const getClassById = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/classes/${id}`);
      return response.data.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Không thể tải thông tin lớp học';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Tạo lớp học (chỉ admin)
  const createClass = async (classData) => {
    setLoading(true);
    try {
      const response = await api.post('/classes', classData);
      message.success('Tạo lớp học thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Tạo lớp học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật lớp học (chỉ admin)
  const updateClass = async (id, classData) => {
    setLoading(true);
    try {
      const response = await api.put(`/classes/${id}`, classData);
      message.success('Cập nhật lớp học thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Cập nhật lớp học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Xóa lớp học (chỉ admin)
  const deleteClass = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/classes/${id}`);
      message.success('Xóa lớp học thành công!');
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Xóa lớp học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTeachingDaysForClass = useCallback(
    async (classId, teachingDays) => {
      setLoading(true);
      try {
        const response = await api.patch(`/classes/${classId}/teaching-days`, {
          teachingDays,
        });
        message.success('Đã cập nhật ngày giảng dạy cho lớp.');

        const updatedClass = response.data.data;
        setClasses((prev) =>
          prev.map((cls) => (cls._id === classId ? updatedClass : cls))
        );

        return updatedClass;
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || 'Cập nhật ngày giảng dạy thất bại';
        message.error(errorMsg);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const value = {
    classes,
    loading,
    teacherProfile,
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    updateTeachingDaysForClass,
  };

  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};
