export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
};

export const validatePhone = (value) => {
  // Chuẩn VN: 0XXXXXXXXX (10 số) hoặc +84XXXXXXXXX (9 số sau +84)
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return /^(0\d{9}|\+84\d{9})$/.test(v);
};