import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const TeacherList = () => {
  const { user, api } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [lecturerUsers, setLecturerUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form] = Form.useForm();

  const canManage = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    await loadTeachers();
    await loadLecturerUsers();
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teachers');
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error('Load teachers error:', error);
      message.error('Không thể tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const loadLecturerUsers = async () => {
    try {
      const response = await api.get('/users?role=lecturer');
      const allLecturers = response.data.data || [];
      const teacherUserIds = teachers.map(t => t.user?._id);
      const availableLecturers = allLecturers.filter(
        u => !teacherUserIds.includes(u._id)
      );
      setLecturerUsers(availableLecturers);
    } catch (error) {
      console.error('Load lecturer users error:', error);
    }
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingTeacher(record);
    form.setFieldsValue({
      userId: record.user?._id,
      title: record.title,
      expertise: record.expertise,
      department: record.department,
      level: record.level
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingTeacher) {
        // update
        await api.put(`/teachers/${editingTeacher._id}`, values);
        message.success('Cập nhật teacher profile thành công!');
      } else {
        // create
        await api.post('/teachers', values);
        message.success('Tạo teacher profile thành công!');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Submit teacher error:', error);
      const errorMsg = error.response?.data?.message || 'Thao tác thất bại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/teachers/${id}`);
      message.success('Xóa teacher thành công!');
      loadData();
    } catch (error) {
      console.error('Delete teacher error:', error);
      message.error('Xóa teacher thất bại');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record.user?.fullName || text
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text, record) => record.user?.email || text
    },
    {
      title: 'Chức danh',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'expertise',
      key: 'expertise'
    },
    {
      title: 'Khoa',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level) => {
        const colors = {
          Junior: 'blue',
          'Mid-level': 'green',
          Senior: 'orange',
          Expert: 'red'
        };
        return <Tag color={colors[level]}>{level}</Tag>;
      }
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
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(record)}
                />
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Xác nhận xóa',
                      content: 'Bạn có chắc muốn xóa teacher này?',
                      okText: 'Xóa',
                      cancelText: 'Hủy',
                      onOk: () => handleDelete(record._id)
                    });
                  }}
                />
              </Space>
            )
          }
        ]
      : [])
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
          </Space>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Tạo Teacher Profile
            </Button>
          )}
        </div>

        {lecturerUsers.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 8 }}>
            <Space>
              <UserAddOutlined style={{ color: '#fa8c16' }} />
              <span>
                Có <strong>{lecturerUsers.length}</strong> user với role "lecturer" chưa có teacher profile.
              </span>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingTeacher ? 'Chỉnh sửa Teacher Profile' : 'Tạo Teacher Profile'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingTeacher && (
            <Form.Item
              label="Chọn User (Lecturer)"
              name="userId"
              rules={[{ required: true, message: 'Vui lòng chọn user' }]}
            >
              <Select placeholder="Chọn user với role lecturer">
                {lecturerUsers.map((lecturer) => (
                  <Option key={lecturer._id} value={lecturer._id}>
                    {lecturer.fullName || lecturer.username} ({lecturer.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Chức danh"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập chức danh' }]}
          >
            <Input placeholder="VD: Thạc sĩ, Tiến sĩ, Giảng viên" />
          </Form.Item>

          <Form.Item
            label="Chuyên môn"
            name="expertise"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên môn' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="VD: Web Development, JavaScript, React, Node.js"
            />
          </Form.Item>

          <Form.Item label="Khoa" name="department">
            <Input placeholder="VD: Khoa Công nghệ thông tin" />
          </Form.Item>

          <Form.Item label="Cấp độ" name="level" initialValue="Mid-level">
            <Select>
              <Option value="Junior">Junior</Option>
              <Option value="Mid-level">Mid-level</Option>
              <Option value="Senior">Senior</Option>
              <Option value="Expert">Expert</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTeacher ? 'Lưu thay đổi' : 'Tạo Teacher Profile'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherList;
