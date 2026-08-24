// src/hooks/useForgotPassword.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services';
import axios from 'axios';

export const useForgotPassword = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');

  const validateForm = (): boolean => {
    if (!email) {
      setFormError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear all messages when user starts typing
    if (formError) setFormError('');
    if (errorMessage) setErrorMessage('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const data = await forgotPassword(email);
      
      if (data.success) {
        setMessage(data.message || 'Password reset link has been sent to your email!');
        setEmail('');
        // Navigate after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setErrorMessage(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let message = 'Network error. Please check your connection and try again.';
      
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.message;
      }
      
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    isLoading,
    message,
    errorMessage,
    formError,
    handleChange,
    handleSubmit
  };
};