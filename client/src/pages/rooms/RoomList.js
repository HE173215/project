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
  InputNumber,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const RoomList = () => {
  const { user } = useAuth();
  const { rooms, loading, getAllRooms, createRoom, updateRoom, deleteRoom } = useRoom();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form] = Form.useForm();

  const canManage = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      await getAllRooms();
    } catch (error) {
      console.error('Load rooms error:', error);
    }
  };

  const handleCreate = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    form.setFieldsValue(room);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteRoom(id);
      loadRooms();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom._id, values);
      } else {
        await createRoom(values);
      }
      setModalVisible(false);
      loadRooms();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const columns = [
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100
    },
    {
      title: 'Loại phòng',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const colors = {
          Classroom: 'blue',
          Lab: 'green',
          'Lecture Hall': 'purple',
          'Meeting Room': 'orange'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Tòa nhà',
      dataIndex: 'building',
      key: 'building',
      width: 120
    },
    {
      title: 'Tầng',
      dataIndex: 'floor',
      key: 'floor',
      width: 80
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          Available: 'success',
          Occupied: 'warning',
          Maintenance: 'error',
          Reserved: 'default'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
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
      : [])
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRooms}>
              Làm mới
            </Button>
          </Space>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm phòng học
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingRoom ? 'Chỉnh sửa phòng học' : 'Thêm phòng học mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên phòng"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
          >
            <Input placeholder="VD: A101" />
          </Form.Item>

          <Form.Item
            label="Sức chứa"
            name="capacity"
            rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Loại phòng" name="type" initialValue="Classroom">
            <Select>
              <Option value="Classroom">Classroom</Option>
              <Option value="Lab">Lab</Option>
              <Option value="Lecture Hall">Lecture Hall</Option>
              <Option value="Meeting Room">Meeting Room</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Tòa nhà" name="building">
            <Input placeholder="VD: Building A" />
          </Form.Item>

          <Form.Item label="Tầng" name="floor">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" initialValue="Available">
            <Select>
              <Option value="Available">Available</Option>
              <Option value="Occupied">Occupied</Option>
              <Option value="Maintenance">Maintenance</Option>
              <Option value="Reserved">Reserved</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả về phòng học" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRoom ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomList;
