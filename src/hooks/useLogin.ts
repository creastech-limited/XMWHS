import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../services';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { LoginRequest } from '../types/auth';
import type { User } from '../types/user';
import { isDidAgent } from '../utils/didAgent';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormErrors {
  email: string;
  password: string;
}

const MOBILE_ONLY_ROLES = ['security', 'agent', 'parent', 'student'];

export const useLogin = () => {
  const navigate = useNavigate();
  const authContext = useAuth();

  if (!authContext) {
    throw new Error('AuthContext is undefined. Ensure you are using AuthProvider.');
  }

  const { login } = authContext;

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<LoginFormErrors>({
    email: '',
    password: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const credentials: LoginRequest = {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      };

      const data = await apiLogin(credentials);

      const role = String(data.user?.role ?? '').toLowerCase();

      // Mobile-only roles get the download modal, except DID agents,
      // who use the web portal.
      if (MOBILE_ONLY_ROLES.includes(role) && !isDidAgent(data.user)) {
        setShowDownloadModal(true);
        return;
      }

      // login() redirects to the right home route itself (see AuthContext)
      login(data.user as User, data.accessToken);

      // const data = await apiLogin(credentials);
      // login(data.user as User, data.accessToken);
      // navigate('/dashboard'); // Or redirect to appropriate dashboard

    } catch (error: unknown) {
      console.error('Login error:', error);

      let message = 'An error occurred. Please try again later.';

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    errorMessage,
    isLoading,
    showPassword,
    setShowPassword,
    showDownloadModal,
    setShowDownloadModal,
    handleChange,
    handleSubmit
  };
};