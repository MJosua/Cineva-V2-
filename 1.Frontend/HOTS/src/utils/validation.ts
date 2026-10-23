
export interface ValidationResult {
  isValid: boolean;
  errors: {
    username?: string;
    password?: string;
  };
}

export const validateLoginForm = (username: string, password: string): ValidationResult => {
  const errors: { username?: string; password?: string } = {};
  let isValid = true;

  // Username validation
  if (!username.trim()) {
    errors.username = 'Username is required';
    isValid = false;
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
    isValid = false;
  }

  // Password validation
  if (!password) {
    errors.password = 'Password is required';
    isValid = false;
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  return { isValid, errors };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
