// src/hooks/useResetPassword.ts
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../services';
import { validatePassword, getPasswordRequirements } from '../utils/validators';
import axios from 'axios';
import type { ResetPasswordResponse } from '../types/auth';

export const useResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [formErrors, setFormErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Token validation on mount
  useEffect(() => {
    if (!token || token.trim() === '' || token.length < 10) {
      setIsTokenValid(false);
      setErrorMessage('Invalid or missing reset token.');
      return;
    }
    setIsTokenValid(true);
  }, [token]);

  const validateForm = (): boolean => {
    let isValid = true;
    const errors = { newPassword: '', confirmPassword: '' };
    
    // New password validation
    if (!newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (!validatePassword(newPassword)) {
      errors.newPassword = 'Password must meet all requirements below';
      isValid = false;
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'newPassword') setNewPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    
    // Clear errors when user starts typing
    if (formErrors.newPassword || formErrors.confirmPassword) {
      setFormErrors({ newPassword: '', confirmPassword: '' });
    }
    if (errorMessage) setErrorMessage('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const result: ResetPasswordResponse = await resetPassword(token, newPassword);

      if (result.success) {
        setMessage(result.message || 'Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(result.message || 'Failed to reset password. The link may have expired.');
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      let message = 'Network error. Please check your connection and try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400 || error.response?.status === 410) {
          setIsTokenValid(false);
          message = error.response?.data?.message || 'This reset link has expired or is invalid.';
        } else {
          message = error.response?.data?.message || error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = getPasswordRequirements(newPassword);

  return {
    newPassword,
    confirmPassword,
    showNewPassword,
    showConfirmPassword,
    isLoading,
    message,
    errorMessage,
    isTokenValid,
    formErrors,
    passwordRequirements,
    setShowNewPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit
  };
};