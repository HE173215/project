import { createContext, useContext, useState } from "react";
import axios from "../utils/axiosInstance";
import { message } from "antd";

const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
  const [schedules, setSchedules] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // =======================================================
  // 🔹 GET ALL SCHEDULES (phân trang + tự phân quyền backend)
  // =======================================================
  const getAllSchedules = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get("/schedules", { params }); // ✅ XÓA /api
      if (res.data?.success) {
        setSchedules(res.data.data || []);
        setTotal(res.data.total || 0);
      } else {
        setSchedules([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("❌ Lỗi getAllSchedules:", err);
      message.error(err.response?.data?.message || "Không thể tải lịch học");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // 🔹 CREATE SCHEDULE
  // =======================================================
  const createSchedule = async (data) => {
    try {
      const res = await axios.post("/schedules", data); // ✅ XÓA /api
      if (res.data?.success) {
        message.success("Tạo lịch học thành công");
        return res.data.data;
      }
    } catch (err) {
      console.error("❌ Lỗi createSchedule:", err);
      message.error(err.response?.data?.message || "Không thể tạo lịch học");
      throw err;
    }
  };

  // =======================================================
  // 🔹 UPDATE SCHEDULE
  // =======================================================
  const updateSchedule = async (id, data) => {
    try {
      const res = await axios.put(`/schedules/${id}`, data); // ✅ XÓA /api
      if (res.data?.success) {
        message.success("Cập nhật lịch học thành công");
        return res.data.data;
      }
    } catch (err) {
      console.error("❌ Lỗi updateSchedule:", err);
      message.error(err.response?.data?.message || "Không thể cập nhật lịch học");
      throw err;
    }
  };

  // =======================================================
  // 🔹 DELETE SCHEDULE
  // =======================================================
  const deleteSchedule = async (id) => {
    try {
      const res = await axios.delete(`/schedules/${id}`); // ✅ XÓA /api
      if (res.data?.success) {
        message.success("Xóa lịch học thành công");
      }
    } catch (err) {
      console.error("❌ Lỗi deleteSchedule:", err);
      message.error(err.response?.data?.message || "Không thể xóa lịch học");
      throw err;
    }
  };

  // =======================================================
  // 🔹 GET SCHEDULES BY CLASS (không phân trang)
  // =======================================================
  const getSchedulesByClass = async (classId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/schedules/class/${classId}`); // ✅ XÓA /api
      if (res.data?.success) {
        setSchedules(res.data.data || []);
        setTotal(res.data.count || 0);
      } else {
        setSchedules([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("❌ Lỗi getSchedulesByClass:", err);
      message.error(err.response?.data?.message || "Không thể tải lịch học theo lớp");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        total,
        loading,
        getAllSchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getSchedulesByClass,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => useContext(ScheduleContext);