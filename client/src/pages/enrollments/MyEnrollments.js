import React, { useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Card, Popconfirm, Progress } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useEnrollment } from '../../context/EnrollmentContext';

const MyEnrollments = () => {
  const { myEnrollments, loading, getMyEnrollments, dropEnrollment } = useEnrollment();

  const loadEnrollments = useCallback(async () => {
    try {
      await getMyEnrollments();
    } catch (error) {
      console.error('Load error:', error);
    }
  }, [getMyEnrollments]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleDrop = async (id) => {
    try {
      await dropEnrollment(id);
      loadEnrollments();
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const columns = [
    {
      title: 'Khóa học',
      dataIndex: ['course', 'title'],
      key: 'course',
      render: (title, record) => title || record.course?.name || 'Đang chờ phê duyệt'
    },
    {
      title: 'Lớp học',
      dataIndex: ['class', 'title'],
      key: 'class',
      render: (title) => title || 'Chưa được xếp lớp'
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
        const info = map[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: 'Điểm',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      render: (grade) => (grade !== undefined && grade !== null ? `${grade}/100` : '-')
    },
    {
      title: 'Tỷ lệ tham gia',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 150,
      render: (rate) => (
        <Progress
          percent={Number(rate ?? 0)}
          size="small"
          status={rate >= 80 ? 'success' : rate >= 50 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          {record.status === 'Approved' && record.class && (
            <Popconfirm
              title="Bạn có chắc muốn hủy đăng ký?"
              onConfirm={() => handleDrop(record._id)}
              okText="Hủy đăng ký"
              cancelText="Không"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Hủy
              </Button>
            </Popconfirm>
          )}
          {record.status === 'DropRequested' && (
            <Tag color="gold">Đang chờ phê duyệt hủy</Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Lớp học của tôi"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadEnrollments}>
            Làm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={myEnrollments}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MyEnrollments;
