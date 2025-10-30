import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Select,
  Popconfirm,
  Modal,
  Input,
  Typography,
  message,
  Badge,
  Divider,
  Tooltip
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SwapOutlined,
  RobotOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useEnrollment } from '../../context/EnrollmentContext';

const { Option } = Select;
const { Title, Text } = Typography;

const EnrollmentManagement = () => {
  const {
    enrollments,
    loading,
    getAllEnrollments,
    approveEnrollment,
    rejectEnrollment,
    reassignEnrollment,
    autoAssignEnrollment,
    approveDropRequest,
    rejectDropRequest
  } = useEnrollment();

  const [statusFilter, setStatusFilter] = useState('PendingApproval');
  const [reassignModal, setReassignModal] = useState({
    open: false,
    enrollmentId: null,
    student: '',
    currentClass: ''
  });
  const [newClassId, setNewClassId] = useState('');

  // Fetch data
  const loadEnrollments = useCallback(async () => {
    try {
      await getAllEnrollments({ status: statusFilter });
    } catch (error) {
      console.error('Load enrollments error:', error);
    }
  }, [getAllEnrollments, statusFilter]);

  useEffect(() => {
    loadEnrollments();
  }, [statusFilter]);

  // Actions
  const handleApprove = async (id) => {
    await approveEnrollment(id);
    loadEnrollments();
  };

  const handleReject = async (id) => {
    await rejectEnrollment(id);
    loadEnrollments();
  };

  const handleAutoAssign = async (id) => {
    await autoAssignEnrollment(id);
    loadEnrollments();
  };

  const handleApproveDrop = async (id) => {
    await approveDropRequest(id);
    loadEnrollments();
  };

  const handleRejectDrop = async (id) => {
    await rejectDropRequest(id);
    loadEnrollments();
  };

  const handleOpenReassign = (record) => {
    setNewClassId('');
    setReassignModal({
      open: true,
      enrollmentId: record._id,
      student: record.user?.fullName || record.user?.username || 'Không rõ',
      currentClass: record.class?.title || 'Chưa có lớp'
    });
  };

  const handleReassignSubmit = async () => {
    if (!newClassId.trim()) {
      message.warning('Vui lòng nhập Class ID mới');
      return;
    }
    await reassignEnrollment(reassignModal.enrollmentId, newClassId.trim());
    handleCloseReassign();
    loadEnrollments();
  };

  const handleCloseReassign = () => {
    setReassignModal({ open: false, enrollmentId: null, student: '', currentClass: '' });
    setNewClassId('');
  };

  // Table columns
  const columns = [
    {
      title: 'Sinh viên',
      dataIndex: ['user', 'fullName'],
      key: 'user',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.fullName || record.user?.username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email}
          </Text>
        </Space>
      )
    },
    {
      title: 'Khóa học',
      dataIndex: ['course', 'title'],
      key: 'course',
      width: 200,
      render: (title) => <Text>{title || <i>Chưa có dữ liệu</i>}</Text>
    },
    {
      title: 'Lớp học',
      dataIndex: ['class', 'title'],
      key: 'class',
      width: 220,
      render: (title) =>
        title ? (
          <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>
            {title}
          </Tag>
        ) : (
          <Tag color="default">Chưa xếp lớp</Tag>
        )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        const map = {
          PendingApproval: { color: 'orange', text: 'Chờ phê duyệt' },
          Approved: { color: 'green', text: 'Đã phê duyệt' },
          DropRequested: { color: 'gold', text: 'Chờ hủy' },
          Rejected: { color: 'red', text: 'Từ chối' },
          Completed: { color: 'blue', text: 'Hoàn thành' },
          Dropped: { color: 'default', text: 'Đã hủy' }
        };
        const s = map[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 130,
      render: (date) =>
        date ? (
          <Text>{moment(date).format('DD/MM/YYYY')}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      align: 'center',
      render: (_, record) => (
        <Space>
          {record.status === 'PendingApproval' && (
            <>
              <Popconfirm
                title="Phê duyệt đăng ký này?"
                onConfirm={() => handleApprove(record._id)}
              >
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  size="small"
                  style={{ borderRadius: 6 }}
                >
                  Duyệt
                </Button>
              </Popconfirm>

              <Popconfirm title="Từ chối đăng ký này?" onConfirm={() => handleReject(record._id)}>
                <Button danger icon={<CloseOutlined />} size="small" style={{ borderRadius: 6 }}>
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'Approved' && (
            <Space>
              {!record.class && (
                <Tooltip title="AI tự động xếp lớp phù hợp">
                  <Button
                    icon={<RobotOutlined />}
                    type="dashed"
                    size="small"
                    onClick={() => handleAutoAssign(record._id)}
                  >
                    Xếp lớp AI
                  </Button>
                </Tooltip>
              )}
              <Tooltip title="Chuyển sang lớp khác">
                <Button
                  icon={<SwapOutlined />}
                  size="small"
                  onClick={() => handleOpenReassign(record)}
                >
                  Đổi lớp
                </Button>
              </Tooltip>
            </Space>
          )}

          {record.status === 'DropRequested' && (
            <Space>
              <Popconfirm title="Phê duyệt yêu cầu hủy lớp này?" onConfirm={() => handleApproveDrop(record._id)}>
                <Button type="primary" size="small" icon={<CheckOutlined />}>Phê duyệt hủy</Button>
              </Popconfirm>
              <Popconfirm title="Từ chối yêu cầu hủy lớp này?" onConfirm={() => handleRejectDrop(record._id)}>
                <Button size="small" danger icon={<CloseOutlined />}>Từ chối hủy</Button>
              </Popconfirm>
            </Space>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
      }}
    >
      <Space
        direction="vertical"
        size="large"
        style={{
          width: '100%'
        }}
      >
        {/* Header */}
        <Space
          align="center"
          style={{
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Quản lý đăng ký & phê duyệt khóa học
            </Title>
            <Text type="secondary">
              Duyệt, từ chối hoặc xếp lớp tự động bằng AI cho sinh viên.
            </Text>
          </div>

          <Space>
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 180 }}
              allowClear
            >
              <Option value="">Tất cả</Option>
              <Option value="PendingApproval">Chờ phê duyệt</Option>
              <Option value="Approved">Đã phê duyệt</Option>
              <Option value="DropRequested">Chờ hủy</Option>
              <Option value="Rejected">Từ chối</Option>
              <Option value="Completed">Hoàn thành</Option>
              <Option value="Dropped">Đã hủy</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={loadEnrollments}
              shape="round"
              style={{ backgroundColor: '#f0f2f5', border: 'none' }}
            >
              Làm mới
            </Button>
          </Space>
        </Space>

        <Divider style={{ margin: '8px 0' }} />

        {/* Table */}
        <Table
          columns={columns}
          dataSource={enrollments}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered={false}
          size="middle"
        />
      </Space>

      {/* Modal đổi lớp */}
      <Modal
        open={reassignModal.open}
        title="Cập nhật lớp học cho sinh viên"
        okText="Lưu thay đổi"
        cancelText="Hủy"
        onOk={handleReassignSubmit}
        onCancel={handleCloseReassign}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <strong>Sinh viên:</strong> {reassignModal.student}
          </Text>
          <Text>
            <strong>Lớp hiện tại:</strong> {reassignModal.currentClass}
          </Text>
          <Input
            placeholder="Nhập Class ID mới"
            value={newClassId}
            onChange={(e) => setNewClassId(e.target.value)}
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default EnrollmentManagement;
