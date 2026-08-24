// src/utils/validators.ts
import type { AxiosError } from 'axios';

/**
 * Email validation
 */
export const validateEmail = (email: string): string => {
  if (!email) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
  return '';
};

/**
 * Password strength validation
 * Returns true if password meets all requirements
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

/**
 * Get password requirements with their status
 */
export const getPasswordRequirements = (password: string) => {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
};

/**
 * Name validation
 */
export const validateName = (name: string, fieldName: string): string => {
  if (!name.trim()) return `${fieldName} is required`;
  return '';
};

/**
 * Type guard for Axios errors
 */
export const isAxiosError = (error: unknown): error is AxiosError<{ message: string }> => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error
  );
};

/**
 * Generic required field validator
 */
export const validateRequired = (value: string, fieldName: string): string => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return '';
};

/**
 * Password validator for form fields (returns error message)
 */
export const validatePasswordField = (password: string): string => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!validatePassword(password)) {
    return 'Password must include uppercase, lowercase, number, and special character';
  }
  return '';
};

/**
 * Confirm password validator
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

// Legacy validators object (for backward compatibility)
export const validators = {
  email: validateEmail,
  password: validatePasswordField,
  required: validateRequired,
};