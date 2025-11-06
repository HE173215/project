import React, { useEffect } from 'react';
import { List, Card, Button, Space, Empty, Popconfirm } from 'antd';
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
      Info: '#1890ff',
      Success: '#52c41a',
      Warning: '#faad14',
      Error: '#f5222d',
      Announcement: '#722ed1'
    };
    return colors[type] || '#d9d9d9';
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
                backgroundColor: item.isRead ? 'transparent' : '#f6f8fb',
                padding: '14px 16px',
                borderRadius: '8px',
                marginBottom: '12px',
                borderLeft: `4px solid ${getTypeColor(item.type)}`,
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
              actions={[
                !item.isRead && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(item._id)}
                    style={{ color: '#52c41a', padding: '4px 8px' }}
                  >
                    Đã đọc
                  </Button>
                ),
                <Popconfirm
                  title="Xóa thông báo?"
                  onConfirm={() => handleDelete(item._id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ padding: '4px 8px' }}>
                    Xóa
                  </Button>
                </Popconfirm>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      borderRadius: '50%',
                      backgroundColor: getTypeColor(item.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <BellOutlined />
                  </div>
                }
                title={
                  <span
                    style={{
                      fontWeight: item.isRead ? '400' : '600',
                      fontSize: '16px',
                      color: '#000'
                    }}
                  >
                    {item.title}
                  </span>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    <p
                      style={{
                        margin: '4px 0',
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.5'
                      }}
                    >
                      {item.message}
                    </p>
                    <small style={{ color: '#999', fontSize: '12px' }}>
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
