import React, { createContext, useState, useContext, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { api } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get my notifications
  const getMyNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/my-notifications', { params });
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount || 0);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải thông báo';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get unread count
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data.unreadCount);
      return response.data.data.unreadCount;
    } catch (error) {
      console.error('Get unread count error:', error);
    }
  }, [api]);

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true, readAt: new Date() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể đánh dấu đã đọc';
      message.error(errorMsg);
      throw error;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/mark-all-read');
      message.success('Đã đánh dấu tất cả là đã đọc');
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể đánh dấu tất cả';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      message.success('Xóa thông báo thành công');
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xóa thông báo thất bại';
      message.error(errorMsg);
      throw error;
    }
  };

  // Delete read notifications
  const deleteReadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/notifications/delete-read');
      message.success(`Đã xóa ${response.data.deletedCount} thông báo`);
      // Update local state
      setNotifications(prev => prev.filter(notif => !notif.isRead));
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xóa thông báo thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create notification (Admin, Manager)
  const createNotification = async (notificationData) => {
    setLoading(true);
    try {
      const response = await api.post('/notifications', notificationData);
      message.success('Tạo thông báo thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Tạo thông báo thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create bulk notifications (Admin, Manager)
  const createBulkNotifications = async (userIds, notificationData) => {
    setLoading(true);
    try {
      const response = await api.post('/notifications/bulk', {
        userIds,
        ...notificationData
      });
      message.success(`Đã gửi thông báo đến ${response.data.count} người dùng`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Gửi thông báo thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    createNotification,
    createBulkNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
