// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Password validation
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Phone validation (Vietnamese format)
export const validatePhone = (phone) => {
  const re = /^[0-9]{10,11}$/;
  return re.test(phone);
};

// Username validation
export const validateUsername = (username) => {
  return username.length >= 3 && username.length <= 30;
};

// OTP validation
export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

// Form validation helper
export const validateForm = (fields) => {
  const errors = {};

  Object.keys(fields).forEach((key) => {
    const value = fields[key];

    switch (key) {
      case 'email':
        if (!value) {
          errors[key] = 'Email là bắt buộc';
        } else if (!validateEmail(value)) {
          errors[key] = 'Email không hợp lệ';
        }
        break;

      case 'password':
        if (!value) {
          errors[key] = 'Mật khẩu là bắt buộc';
        } else if (!validatePassword(value)) {
          errors[key] = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        break;

      case 'username':
        if (!value) {
          errors[key] = 'Username là bắt buộc';
        } else if (!validateUsername(value)) {
          errors[key] = 'Username phải có từ 3-30 ký tự';
        }
        break;

      case 'phone':
        if (value && !validatePhone(value)) {
          errors[key] = 'Số điện thoại không hợp lệ';
        }
        break;

      case 'otp':
        if (!value) {
          errors[key] = 'OTP là bắt buộc';
        } else if (!validateOTP(value)) {
          errors[key] = 'OTP phải có 6 số';
        }
        break;

      default:
        if (!value && key !== 'phone' && key !== 'fullName') {
          errors[key] = 'Trường này là bắt buộc';
        }
    }
  });

  return errors;
};
