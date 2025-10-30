import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Checkbox,
  Space,
  Typography,
  Button,
  message,
  Divider,
  Skeleton,
  Empty,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  BookOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { useClass } from "../../context/ClassContext";

const daysOfWeek = [
  { label: "Thứ 2", value: "monday" },
  { label: "Thứ 3", value: "tuesday" },
  { label: "Thứ 4", value: "wednesday" },
  { label: "Thứ 5", value: "thursday" },
  { label: "Thứ 6", value: "friday" },
  { label: "Thứ 7", value: "saturday" },
  { label: "Chủ nhật", value: "sunday" },
];

const { Text, Title } = Typography;

const LecturerEnrollments = () => {
  const { classes, loading, getAllClasses, updateTeachingDaysForClass } =
    useClass();
  const [selectedDays, setSelectedDays] = useState({});

  // Load dữ liệu
  useEffect(() => {
    getAllClasses();
  }, [getAllClasses]);

  // Gán giá trị teachingDays ban đầu
  useEffect(() => {
    const init = {};
    classes.forEach((cls) => {
      init[cls._id] = cls.teachingDays || [];
    });
    setSelectedDays(init);
  }, [classes]);

  // Cập nhật lựa chọn ngày
  const handleDayChange = (classId, values) => {
    setSelectedDays((prev) => ({ ...prev, [classId]: values }));
  };

  // Lưu thay đổi
  const handleSave = useCallback(
    async (classId) => {
      try {
        await updateTeachingDaysForClass(classId, selectedDays[classId] || []);
      } catch {}
    },
    [selectedDays, updateTeachingDaysForClass]
  );

  // Cấu trúc bảng
  const columns = useMemo(
    () => [
      {
        title: "Lớp học",
        dataIndex: "title",
        key: "title",
        width: 250,
        render: (text, record) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 15 }}>
              {text}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã lớp: {record?._id ? record._id.slice(-6) : "---"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Khóa học",
        dataIndex: ["course", "title"],
        key: "course",
        width: 220,
        render: (title) => (
          <Tag color="blue" style={{ fontSize: 13, padding: "3px 8px" }}>
            {title || "Chưa xác định"}
          </Tag>
        ),
      },
      {
        title: "Thời gian",
        key: "time",
        width: 200,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text>
              {moment(record.startDate).format("DD/MM/YYYY")} →{" "}
              {moment(record.endDate).format("DD/MM/YYYY")}
            </Text>
            <Tag
              color={
                record.status === "Active"
                  ? "green"
                  : record.status === "Pending"
                  ? "orange"
                  : record.status === "Completed"
                  ? "blue"
                  : "default"
              }
              style={{ width: "fit-content" }}
            >
              {record.status}
            </Tag>
          </Space>
        ),
      },
      {
        title: "Ngày giảng dạy trong tuần",
        key: "teachingDays",
        width: 400,
        render: (_, record) => (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Checkbox.Group
              options={daysOfWeek}
              value={selectedDays[record._id] || []}
              onChange={(values) => handleDayChange(record._id, values)}
              style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
            />
            <Tooltip title="Lưu thay đổi ngày dạy cho lớp này">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => handleSave(record._id)}
                disabled={loading}
                style={{
                  width: 120,
                  borderRadius: 6,
                  backgroundColor: "#1677ff",
                }}
              >
                Lưu
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [loading, selectedDays, handleSave]
  );

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        background: "#ffffff",
      }}
      title={
        <Space>
          <BookOutlined style={{ color: "#1677ff", fontSize: 20 }} />
          <Title
            level={4}
            style={{
              margin: 0,
              color: "#0f172a",
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            Quản lý lớp giảng dạy của tôi
          </Title>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => getAllClasses()}
          disabled={loading}
          shape="round"
          style={{
            backgroundColor: "#f0f2f5",
            border: "none",
          }}
        >
          Làm mới
        </Button>
      }
    >
      <Divider style={{ margin: "12px 0 20px" }} />

      {loading && classes.length === 0 ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 8,
            showTotal: (total) => `Tổng cộng ${total} lớp`,
            showSizeChanger: false,
          }}
          bordered={false}
          size="middle"
          style={{
            borderRadius: 8,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: "#64748b" }}>
                    Bạn chưa được phân công lớp nào
                  </span>
                }
              />
            ),
          }}
        />
      )}
    </Card>
  );
};

export default LecturerEnrollments;
