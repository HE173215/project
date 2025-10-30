import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Modal,
  Form,
  message,
  Popconfirm,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const CourseList = () => {
  const { user, api } = useAuth();
  const { courses, loading, getAllCourses, createCourse, updateCourse, deleteCourse } = useCourse();
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [form] = Form.useForm();
  const [managerOptions, setManagerOptions] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Role check
  const canManage = ['admin', 'manager'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // ====== API LOADERS ======
  const loadCourses = useCallback(async () => {
    try {
      await getAllCourses({
        search: searchText || undefined,
        level: levelFilter || undefined,
        status: statusFilter || undefined
      });
    } catch (error) {
      console.error('Load courses error:', error);
    }
  }, [getAllCourses, searchText, levelFilter, statusFilter]);

  const loadMyEnrollments = useCallback(async () => {
    if (!isStudent) return;
    try {
      const response = await api.get('/enrollments/my-enrollments');
      setMyEnrollments(response.data.data || []);
    } catch (error) {
      console.error('Load enrollments error:', error);
    }
  }, [api, isStudent]);

  const loadManagers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingManagers(true);
    try {
      const response = await api.get('/users', { params: { role: 'manager', limit: 200 } });
      setManagerOptions(response.data.data || []);
    } catch (error) {
      console.error('Load managers error:', error);
    } finally {
      setLoadingManagers(false);
    }
  }, [api, isAdmin]);

  // ====== INITIAL LOAD ======
  useEffect(() => {
    if (!hasLoaded) {
      (async () => {
        await Promise.all([loadCourses(), loadMyEnrollments(), loadManagers()]);
        setHasLoaded(true);
      })();
    }
  }, [hasLoaded, loadCourses, loadMyEnrollments, loadManagers]);

  // ====== DEBOUNCE SEARCH ======
  useEffect(() => {
    if (!searchText) return;
    const timer = setTimeout(() => {
      handleSearch();
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [searchText]);

  // ====== HANDLERS ======
  const handleSearch = () => {
    setHasLoaded(false);
  };

  const handleRefresh = () => {
    setSearchText('');
    setLevelFilter('');
    setStatusFilter('');
    setHasLoaded(false);
  };

  const handleCreate = () => {
    setEditingCourse(null);
    form.resetFields();
    if (isAdmin) form.setFieldsValue({ managers: [] });
    setModalVisible(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      ...course,
      managers: Array.isArray(course.managers)
        ? course.managers.map((m) => m?._id).filter(Boolean)
        : []
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCourse(id);
      setHasLoaded(false);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        managers: values.managers || undefined
      };

      if (editingCourse) {
        await updateCourse(editingCourse._id, payload);
      } else {
        await createCourse(payload);
      }

      setModalVisible(false);
      setHasLoaded(false);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // ====== STUDENT LOGIC ======
  const isEnrolledInCourse = (courseId) =>
    myEnrollments.some((e) => e.class?.course?._id === courseId);

  const getEnrollmentStatus = (courseId) => {
    const enrollment = myEnrollments.find((e) => e.class?.course?._id === courseId);
    return enrollment?.status || null;
  };

  const handleViewCourseDetail = (course) => {
    setSelectedCourse(course);
    setDetailModalVisible(true);
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse) return;
    setEnrolling(true);
    try {
      await api.post('/enrollments/course-request', { courseId: selectedCourse._id });
      message.success('Đăng ký khóa học thành công! Vui lòng chờ xếp lớp.');
      setDetailModalVisible(false);
      setHasLoaded(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại';
      message.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  // ====== TABLE COLUMNS ======
  const columns = [
    {
      title: 'Mã khóa học',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { title: 'Tên khóa học', dataIndex: 'title', key: 'title' },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level) => {
        const colors = {
          Beginner: 'green',
          Intermediate: 'orange',
          Advanced: 'red',
          Expert: 'purple'
        };
        return <Tag color={colors[level]}>{level}</Tag>;
      }
    },
    { title: 'Thời lượng (giờ)', dataIndex: 'duration', key: 'duration', width: 130 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          Draft: 'default',
          Active: 'success',
          Inactive: 'warning',
          Archived: 'error'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Quản lý',
      dataIndex: 'managers',
      key: 'managers',
      render: (value) =>
        value && value.length
          ? value.map((m) => m?.fullName || m?.username).join(', ')
          : 'N/A'
    },
    ...(canManage
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            render: (_, record) => (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
                <Popconfirm
                  title="Bạn có chắc muốn xóa?"
                  onConfirm={() => handleDelete(record._id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]
      : isStudent
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            render: (_, record) => {
              const enrolled = isEnrolledInCourse(record._id);
              const status = getEnrollmentStatus(record._id);

              if (enrolled) {
                const colors = { Pending: 'orange', Approved: 'green', Rejected: 'red' };
                const texts = { Pending: 'Chờ xếp lớp', Approved: 'Đã xếp lớp', Rejected: 'Từ chối' };
                return <Tag color={colors[status]}>{texts[status]}</Tag>;
              }

              return (
                <Space>
                  <Button
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => handleViewCourseDetail(record)}
                  >
                    Chi tiết
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleViewCourseDetail(record)}
                  >
                    Đăng ký
                  </Button>
                </Space>
              );
            }
          }
        ]
      : [])
  ];

  // ====== RENDER ======
  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Tìm kiếm khóa học..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Cấp độ"
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="Beginner">Beginner</Option>
              <Option value="Intermediate">Intermediate</Option>
              <Option value="Advanced">Advanced</Option>
              <Option value="Expert">Expert</Option>
            </Select>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="Draft">Draft</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Archived">Archived</Option>
            </Select>
            <Button icon={<SearchOutlined />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Làm mới
            </Button>
          </Space>
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm khóa học
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={courses}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Modal thêm / sửa */}
      <Modal
        title={editingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Mã khóa học" name="name" rules={[{ required: true }]}>
            <Input placeholder="VD: WEB101" />
          </Form.Item>
          <Form.Item label="Tên khóa học" name="title" rules={[{ required: true }]}>
            <Input placeholder="VD: Web Development Fundamentals" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} placeholder="Mô tả khóa học" />
          </Form.Item>
          <Form.Item label="Chuyên môn" name="expertise">
            <Input placeholder="VD: HTML, CSS, JS" />
          </Form.Item>
          <Form.Item label="Thời lượng (giờ)" name="duration">
            <Input type="number" placeholder="VD: 40" />
          </Form.Item>
          <Form.Item label="Cấp độ" name="level" initialValue="Beginner">
            <Select>
              <Option value="Beginner">Beginner</Option>
              <Option value="Intermediate">Intermediate</Option>
              <Option value="Advanced">Advanced</Option>
              <Option value="Expert">Expert</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" initialValue="Draft">
            <Select>
              <Option value="Draft">Draft</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Archived">Archived</Option>
            </Select>
          </Form.Item>
          {isAdmin && (
            <Form.Item label="Quản lý" name="managers">
              <Select mode="multiple" placeholder="Chọn manager" loading={loadingManagers} allowClear>
                {managerOptions.map((m) => (
                  <Option key={m._id} value={m._id}>
                    {m.fullName || m.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCourse ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết khóa học"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          !isEnrolledInCourse(selectedCourse?._id) && (
            <Button
              key="enroll"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={enrolling}
              onClick={handleEnrollCourse}
            >
              Đăng ký
            </Button>
          )
        ]}
        width={700}
      >
        {selectedCourse && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã khóa học">
              <Tag color="blue">{selectedCourse.name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên khóa học">{selectedCourse.title}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedCourse.description || 'Không có mô tả'}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên môn">
              {selectedCourse.expertise || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng">
              {selectedCourse.duration} giờ
            </Descriptions.Item>
            <Descriptions.Item label="Cấp độ">
              <Tag color={
                selectedCourse.level === 'Beginner' ? 'green' :
                selectedCourse.level === 'Intermediate' ? 'orange' :
                selectedCourse.level === 'Advanced' ? 'red' : 'purple'
              }>
                {selectedCourse.level}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={
                selectedCourse.status === 'Active' ? 'success' :
                selectedCourse.status === 'Inactive' ? 'warning' : 'default'
              }>
                {selectedCourse.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Quản lý">
              {selectedCourse.managers?.length
                ? selectedCourse.managers.map((m) => m?.fullName || m?.username).join(', ')
                : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CourseList;
