import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useSchedule } from "../../context/ScheduleContext";
import { useClass } from "../../context/ClassContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";

const { Option } = Select;

const ManageScheduleList = () => {
  const {
    schedules,
    total,
    loading: scheduleLoading,
    getAllSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useSchedule();

  const { classes, loading: classLoading, getAllClasses } = useClass();
  const { rooms, loading: roomLoading, getAllRooms } = useRoom();
  const { user } = useAuth();

  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const isAdminOrManager = ["admin", "manager"].includes(user?.role);
  const isLecturer = user?.role === "lecturer";
  const isStudent = user?.role === "student";

  // 🔹 Load lớp và phòng
  useEffect(() => {
    (async () => {
      await Promise.all([getAllClasses(), getAllRooms()]);
    })();
  }, []);

  // 🔹 Khi chọn lớp → tải lịch
  useEffect(() => {
    if (selectedClass)
      getAllSchedules({
        classId: selectedClass._id,
        page: currentPage,
        limit: pageSize,
      });
  }, [selectedClass, currentPage]);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    return classes.filter((cls) =>
      cls.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [classes, search]);

  // 🔹 Modal
  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({ classId: selectedClass._id });
    setEditingSchedule(null);
    setModalOpen(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      classId: schedule.class?._id,
      room: schedule.room?._id,
      date: schedule.date ? moment(schedule.date) : null,
      startTime: schedule.startTime
        ? moment(schedule.startTime, "HH:mm")
        : null,
      endTime: schedule.endTime ? moment(schedule.endTime, "HH:mm") : null,
      topic: schedule.topic || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    form.resetFields();
    setEditingSchedule(null);
    setModalOpen(false);
  };

  // 🔹 Thêm / Cập nhật
  const handleSubmit = async (values) => {
    const payload = {
      classId: selectedClass._id,
      date: values.date?.toISOString(),
      startTime: values.startTime?.format("HH:mm"),
      endTime: values.endTime?.format("HH:mm"),
      room: values.room,
      topic: values.topic?.trim(),
    };
    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule._id, payload);
      } else {
        await createSchedule(payload);
      }
      await getAllSchedules({
        classId: selectedClass._id,
        page: currentPage,
        limit: pageSize,
      });
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    await deleteSchedule(scheduleId);
    await getAllSchedules({
      classId: selectedClass._id,
      page: currentPage,
      limit: pageSize,
    });
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (v) => moment(v).format("DD/MM/YYYY"),
    },
    { title: "Start", dataIndex: "startTime" },
    { title: "End", dataIndex: "endTime" },
    {
      title: "Room",
      render: (_, record) =>
        record.room
          ? `${record.room.name}${
              record.room.building ? ` (${record.room.building})` : ""
            }`
          : "N/A",
    },
    { title: "Topic", dataIndex: "topic" },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          {(isAdminOrManager || isLecturer) && (
            <Button
              icon={<EditOutlined />}
              type="primary"
              size="small"
              onClick={() => openEditModal(record)}
            />
          )}
          {isAdminOrManager && (
            <Popconfirm
              title="Delete this schedule?"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record._id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        selectedClass ? (
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setSelectedClass(null)}
            >
              Back
            </Button>
            <span style={{ fontWeight: 600 }}>{selectedClass.title}</span>
          </Space>
        ) : (
          "Class schedules"
        )
      }
      extra={
        selectedClass && (
          <Space>
            {isAdminOrManager && (
              <Tooltip title="Add new schedule">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateModal}
                  disabled={scheduleLoading}
                >
                  Add
                </Button>
              </Tooltip>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                getAllSchedules({
                  classId: selectedClass._id,
                  page: currentPage,
                  limit: pageSize,
                })
              }
            >
              Refresh
            </Button>
          </Space>
        )
      }
    >
      {/* Danh sách lớp */}
      {!selectedClass ? (
        <>
          <Input
            placeholder="Search class..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320, marginBottom: 16 }}
          />
          <Table
            dataSource={filteredClasses}
            rowKey="_id"
            loading={classLoading}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: "Class Name", dataIndex: "title" },
              { title: "Course Code", dataIndex: "name" },
              {
                title: "Action",
                render: (_, record) => (
                  <Button
                    type="link"
                    onClick={() => setSelectedClass(record)}
                  >
                    View schedules
                  </Button>
                ),
              },
            ]}
          />
        </>
      ) : (
        // Danh sách lịch học
        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="_id"
          loading={scheduleLoading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showTotal: (t) => `Total ${t} schedules`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      )}

      {/* Modal thêm/sửa lịch */}
      <Modal
        title={editingSchedule ? "Edit schedule" : "Create schedule"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            label="Start time"
            name="startTime"
            rules={[{ required: true }]}
          >
            <TimePicker style={{ width: "100%" }} format="HH:mm" />
          </Form.Item>
          <Form.Item
            label="End time"
            name="endTime"
            rules={[{ required: true }]}
          >
            <TimePicker style={{ width: "100%" }} format="HH:mm" />
          </Form.Item>
          <Form.Item
            label="Room"
            name="room"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select room" loading={roomLoading}>
              {rooms.map((r) => (
                <Option key={r._id} value={r._id}>
                  {r.name} {r.building && `(${r.building})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Topic" name="topic">
            <Input placeholder="Enter topic (optional)" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={closeModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
              >
                {editingSchedule ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ManageScheduleList;
