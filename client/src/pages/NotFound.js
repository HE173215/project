import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const NotFound = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
        extra={
          <Link to="/dashboard">
            <Button type="primary" icon={<HomeOutlined />}>
              Về trang chủ
            </Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFound;
