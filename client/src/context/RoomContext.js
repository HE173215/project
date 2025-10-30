import React, { createContext, useState, useContext } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContext';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const { api } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get all rooms
  const getAllRooms = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/rooms', { params });
      setRooms(response.data.data);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải danh sách phòng học';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get room by ID
  const getRoomById = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/rooms/${id}`);
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tải thông tin phòng học';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create room
  const createRoom = async (roomData) => {
    setLoading(true);
    try {
      const response = await api.post('/rooms', roomData);
      message.success('Tạo phòng học thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Tạo phòng học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update room
  const updateRoom = async (id, roomData) => {
    setLoading(true);
    try {
      const response = await api.put(`/rooms/${id}`, roomData);
      message.success('Cập nhật phòng học thành công!');
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật phòng học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete room
  const deleteRoom = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/rooms/${id}`);
      message.success('Xóa phòng học thành công!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Xóa phòng học thất bại';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    rooms,
    loading,
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
