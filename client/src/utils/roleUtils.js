// Role configuration
export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'red',
    description: 'Quản trị viên hệ thống'
  },
  student: {
    label: 'Student',
    color: 'blue',
    description: 'Sinh viên'
  },
  lecturer: {
    label: 'Lecturer',
    color: 'green',
    description: 'Giảng viên'
  },
  manager: {
    label: 'Manager',
    color: 'orange',
    description: 'Quản lý'
  }
};

// Get role label
export const getRoleLabel = (role) => {
  return ROLE_CONFIG[role]?.label || role;
};

// Get role color
export const getRoleColor = (role) => {
  return ROLE_CONFIG[role]?.color || 'default';
};

// Get role description
export const getRoleDescription = (role) => {
  return ROLE_CONFIG[role]?.description || '';
};

// Get all roles as array for Select options
export const getAllRoles = () => {
  return Object.keys(ROLE_CONFIG).map(key => ({
    value: key,
    label: ROLE_CONFIG[key].label,
    description: ROLE_CONFIG[key].description
  }));
};
