// Format date to Vietnamese format
export const formatDate = (date) => {
  if (!date) return 'Chưa có thông tin';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format datetime to Vietnamese format
export const formatDateTime = (date) => {
  if (!date) return 'Chưa có thông tin';
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Format: 0123 456 789
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};
