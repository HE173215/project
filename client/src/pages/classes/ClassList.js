import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Input, Select, DatePicker, InputNumber, Popconfirm, message, Divider, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useClass } from '../../context/ClassContext';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ClassList = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const { classes, loading, getAllClasses, createClass, updateClass, deleteClass } = useClass();
  const { courses, getAllCourses } = useCourse();

  const [teachers, setTeachers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const initialFilters = {
    search: '',
    course: 'all',
    teacher: 'all',
    status: 'all',
    dateRange: null
  };
  const [filters, setFilters] = useState(initialFilters);

  // ✅ Chỉ admin hoặc manager có quyền xem trang này
  const canManage = ['admin', 'manager'].includes(user?.role);
  useEffect(() => {
    if (!canManage) {
      message.warning('Bạn không có quyền truy cập trang này');
      navigate('/'); // hoặc chuyển về dashboard
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await api.get('/teachers');
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error('❌ Lỗi tải danh sách giáo viên:', error);
    }
  };

  const loadData = async () => {
    await getAllClasses();
    await getAllCourses();
    await loadTeachers();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleDateFilterChange = (range) => {
    if (!range || range.length !== 2 || !range[0] || !range[1]) {
      handleFilterChange('dateRange', null);
      return;
    }

    const mapped = range.map((date) => (date?.toDate ? moment(date.toDate()).startOf('day') : moment(date).startOf('day')));
    handleFilterChange('dateRange', mapped);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (filters.search) {
        const keyword = filters.search.toLowerCase();
        const titleMatch = cls.title?.toLowerCase().includes(keyword);
        const courseMatch = cls.course?.title?.toLowerCase().includes(keyword);
        if (!titleMatch && !courseMatch) return false;
      }

      if (filters.course !== 'all' && cls.course?._id !== filters.course) {
        return false;
      }

      if (filters.teacher !== 'all' && cls.teacher?._id !== filters.teacher) {
        return false;
      }

      if (filters.status !== 'all' && cls.status !== filters.status) {
        return false;
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        const [start, end] = filters.dateRange;
        const classStart = moment(cls.startDate);
        if (!classStart.isBetween(start, end.clone().endOf('day'), undefined, '[]')) {
          return false;
        }
      }

      return true;
    });
  }, [classes, filters]);

  const handleCreate = () => {
    setEditingClass(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    form.setFieldsValue({
      ...classItem,
      course: classItem.course?._id,
      teacher: classItem.teacher?._id,
      dateRange: [moment(classItem.startDate), moment(classItem.endDate)]
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteClass(id);
      loadData();
    } catch (error) {
      console.error('❌ Lỗi xóa lớp:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
      };
      delete data.dateRange;

      if (editingClass) {
        await updateClass(editingClass._id, data);
      } else {
        await createClass(data);
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('❌ Lỗi submit lớp học:', error);
    }
  };

  const columns = [
    {
      title: 'Tên lớp',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Khóa học',
      dataIndex: ['course', 'title'],
      key: 'course',
      render: (title) => <Tag color="blue" style={{ borderRadius: 4 }}>{title}</Tag>
    },
    {
      title: 'Giáo viên',
      key: 'teacher',
      render: (_, record) => (
        <span>{record.teacher?.user?.fullName || record.teacher?.user?.username || 'Chưa gán'}</span>
      )
    },
    {
      title: 'Sĩ số',
      key: 'students',
      width: 140,
      render: (_, record) => (
        <Tag color={record.currentStudents >= record.maxStudents ? 'error' : 'green'}>
          {record.currentStudents}/{record.maxStudents}
        </Tag>
      )
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { Pending: 'default', Active: 'green', Completed: 'blue', Cancelled: 'red' };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/classes/${record._id}`)} />
          </Tooltip>
          <Popconfirm title="Bạn có chắc muốn xóa lớp học này?" onConfirm={() => handleDelete(record._id)} okText="Xóa" cancelText="Hủy">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý lớp học"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm lớp học</Button>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form layout="inline" style={{ gap: 16, flexWrap: 'wrap' }}>
            <Form.Item label="Tìm kiếm">
              <Input.Search
                placeholder="Tên lớp hoặc khóa học"
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{ minWidth: 220 }}
              />
            </Form.Item>
            <Form.Item label="Khóa học">
              <Select
                value={filters.course}
                onChange={(value) => handleFilterChange('course', value)}
                style={{ width: 200 }}
              >
                <Option value="all">Tất cả</Option>
                {courses.map((course) => (
                  <Option key={course._id} value={course._id}>
                    {course.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Giáo viên">
              <Select
                value={filters.teacher}
                onChange={(value) => handleFilterChange('teacher', value)}
                style={{ width: 200 }}
              >
                <Option value="all">Tất cả</Option>
                {teachers.map((teacher) => (
                  <Option key={teacher._id} value={teacher._id}>
                    {teacher.user?.fullName || teacher.user?.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Trạng thái">
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                style={{ width: 160 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Active">Active</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Thời gian">
              <RangePicker
                value={filters.dateRange || []}
                format="DD/MM/YYYY"
                onChange={handleDateFilterChange}
                style={{ width: 260 }}
              />
            </Form.Item>
            <Form.Item>
              <Button onClick={handleResetFilters}>Đặt lại</Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '12px 0' }} />

          <Table
            columns={columns}
            dataSource={filteredClasses}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Space>
      </Card>

      <Modal
        title={editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Tên lớp" name="title" rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}>
            <Input placeholder="VD: WEB101 - Class A" />
          </Form.Item>

          <Form.Item label="Khóa học" name="course" rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}>
            <Select placeholder="Chọn khóa học">
              {courses.map(course => (
                <Option key={course._id} value={course._id}>{course.title}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Giáo viên" name="teacher" rules={[{ required: true, message: 'Vui lòng chọn giáo viên' }]}>
            <Select placeholder="Chọn giáo viên">
              {teachers.map(teacher => (
                <Option key={teacher._id} value={teacher._id}>
                  {teacher.user?.fullName || teacher.user?.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Số lượng sinh viên tối đa" name="maxStudents" rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Thời gian" name="dateRange" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" initialValue="Pending">
            <Select>
              <Option value="Pending">Pending</Option>
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingClass ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassList;
