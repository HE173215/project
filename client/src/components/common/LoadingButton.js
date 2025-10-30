import React from 'react';
import { Button } from 'antd';

// This component is deprecated. Use Ant Design Button with loading prop directly
// Example: <Button type="primary" loading={loading}>Submit</Button>

const LoadingButton = ({ loading, children, className, ...props }) => {
  return (
    <Button
      {...props}
      className={className}
      loading={loading}
    >
      {children}
    </Button>
  );
};

export default LoadingButton;
