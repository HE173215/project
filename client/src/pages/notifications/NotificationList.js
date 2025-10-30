import React, { useEffect } from 'react';
import { List, Card, Button, Space, Tag, Empty, Popconfirm } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useNotification } from '../../context/NotificationContext';

const NotificationList = () => {
  const {
    notifications,
    loading,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications
  } = useNotification();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      await getMyNotifications();
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDeleteRead = async () => {
    try {
      await deleteReadNotifications();
    } catch (error) {
      console.error('Delete read error:', error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      Info: 'blue',
      Success: 'green',
      Warning: 'orange',
      Error: 'red',
      Announcement: 'purple'
    };
    return colors[type] || 'default';
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Thông báo</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
              Đánh dấu tất cả đã đọc
            </Button>
            <Popconfirm
              title="Xóa tất cả thông báo đã đọc?"
              onConfirm={handleDeleteRead}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button icon={<DeleteOutlined />}>Xóa đã đọc</Button>
            </Popconfirm>
            <Button icon={<ReloadOutlined />} onClick={loadNotifications}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <List
          loading={loading}
          dataSource={notifications}
          locale={{
            emptyText: (
              <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          }}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: item.isRead ? 'transparent' : '#f0f5ff',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
              actions={[
                !item.isRead && (
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(item._id)}
                  >
                    Đánh dấu đã đọc
                  </Button>
                ),
                <Popconfirm
                  title="Xóa thông báo này?"
                  onConfirm={() => handleDelete(item._id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: getTypeColor(item.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <BellOutlined />
                  </div>
                }
                title={
                  <Space>
                    <span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>
                      {item.title}
                    </span>
                    <Tag color={getTypeColor(item.type)}>{item.type}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ margin: '8px 0' }}>{item.message}</p>
                    <small style={{ color: '#999' }}>
                      {moment(item.createdAt).fromNow()}
                    </small>
                  </div>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thông báo`
          }}
        />
      </Card>
    </div>
  );
};

export default NotificationList;
