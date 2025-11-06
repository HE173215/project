import React from 'react';
import { Tag } from 'antd';
import { getRoleLabel, getRoleColor } from '../../utils/roleUtils';

/**
 * Component hiển thị role dưới dạng Tag
 * @param {string} role - Role của user (admin, student, lecturer, manager)
 * @param {object} style - Custom style cho Tag
 */
const RoleTag = ({ role, style = {} }) => {
  const label = getRoleLabel(role);
  const color = getRoleColor(role);

  return (
    <Tag color={color} style={style}>
      {label}
    </Tag>
  );
};

export default RoleTag;
