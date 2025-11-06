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
  Typography,
  message,
  Badge,
  Divider,
  Tooltip,
  Spin
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
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { Title, Text } = Typography;

const EnrollmentManagement = () => {
  const { api } = useAuth();
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
    currentClass: '',
    courseId: null
  });
  const [newClassId, setNewClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

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

  // Load available classes for reassignment
  const loadAvailableClasses = async (courseId) => {
    if (!courseId) {
      setAvailableClasses([]);
      return;
    }

    setLoadingClasses(true);
    try {
      const response = await api.get('/classes', {
        params: {
          course: courseId,
          status: 'Active'
        }
      });
      setAvailableClasses(response.data.data || []);
    } catch (error) {
      console.error('Load classes error:', error);
      message.error('Không thể tải danh sách lớp');
      setAvailableClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleOpenReassign = (record) => {
    setNewClassId('');
    setAvailableClasses([]);
    setReassignModal({
      open: true,
      enrollmentId: record._id,
      student: record.user?.fullName || record.user?.username || 'Không rõ',
      currentClass: record.class?.title || 'Chưa có lớp',
      courseId: record.course?._id || null
    });

    // Load classes for this course
    if (record.course?._id) {
      loadAvailableClasses(record.course._id);
    }
  };

  const handleReassignSubmit = async () => {
    if (!newClassId) {
      message.warning('Vui lòng chọn lớp học mới');
      return;
    }
    await reassignEnrollment(reassignModal.enrollmentId, newClassId);
    handleCloseReassign();
    loadEnrollments();
  };

  const handleCloseReassign = () => {
    setReassignModal({ open: false, enrollmentId: null, student: '', currentClass: '', courseId: null });
    setNewClassId('');
    setAvailableClasses([]);
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
      width: 280,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" style={{ display: 'flex', justifyContent: 'center' }}>
          {record.status === 'PendingApproval' && (
            <>
              <Popconfirm
                title="Phê duyệt đăng ký này?"
                onConfirm={() => handleApprove(record._id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  size="small"
                  style={{ minWidth: 85 }}
                >
                  Duyệt
                </Button>
              </Popconfirm>

              <Popconfirm
                title="Từ chối đăng ký này?"
                onConfirm={() => handleReject(record._id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  danger
                  icon={<CloseOutlined />}
                  size="small"
                  style={{ minWidth: 85 }}
                >
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'Approved' && (
            <>
              {!record.class && (
                <Tooltip title="AI tự động xếp lớp phù hợp">
                  <Button
                    icon={<RobotOutlined />}
                    type="dashed"
                    size="small"
                    onClick={() => handleAutoAssign(record._id)}
                    style={{ minWidth: 110 }}
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
                  style={{ minWidth: 85 }}
                >
                  Đổi lớp
                </Button>
              </Tooltip>
            </>
          )}

          {record.status === 'DropRequested' && (
            <>
              <Popconfirm
                title="Phê duyệt yêu cầu hủy lớp này?"
                onConfirm={() => handleApproveDrop(record._id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  style={{ minWidth: 120 }}
                >
                  Duyệt hủy
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Từ chối yêu cầu hủy lớp này?"
                onConfirm={() => handleRejectDrop(record._id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  style={{ minWidth: 110 }}
                >
                  Từ chối hủy
                </Button>
              </Popconfirm>
            </>
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

          <Space size="middle">
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ minWidth: 180 }}
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
              style={{ minWidth: 100 }}
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
        title="Đổi lớp học cho sinh viên"
        okText="Xác nhận đổi lớp"
        cancelText="Hủy"
        onOk={handleReassignSubmit}
        onCancel={handleCloseReassign}
        confirmLoading={loading}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong style={{ fontSize: 14, color: '#666' }}>Thông tin sinh viên</Text>
            <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <Text><strong>Sinh viên:</strong> {reassignModal.student}</Text>
            </div>
          </div>

          <div>
            <Text strong style={{ fontSize: 14, color: '#666' }}>Lớp hiện tại</Text>
            <div style={{ marginTop: 8, padding: 12, background: '#fff3e0', borderRadius: 8, border: '1px solid #ffb74d' }}>
              <Text><strong>Lớp:</strong> {reassignModal.currentClass}</Text>
            </div>
          </div>

          <div>
            <Text strong style={{ fontSize: 14, color: '#666', display: 'block', marginBottom: 8 }}>
              Chọn lớp mới <Text type="danger">*</Text>
            </Text>
            <Spin spinning={loadingClasses}>
              <Select
                placeholder="Chọn lớp học để chuyển"
                value={newClassId}
                onChange={setNewClassId}
                style={{ width: '100%' }}
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                }
                notFoundContent={
                  loadingClasses ? <Spin size="small" /> :
                  availableClasses.length === 0 ? "Không có lớp khả dụng" : null
                }
              >
                {availableClasses.map((cls) => (
                  <Option key={cls._id} value={cls._id}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{cls.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Sĩ số: {cls.currentStudents || 0}/{cls.maxStudents} |
                        Bắt đầu: {moment(cls.startDate).format('DD/MM/YYYY')}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Spin>
            {availableClasses.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                Tìm thấy {availableClasses.length} lớp khả dụng
              </Text>
            )}
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default EnrollmentManagement;
