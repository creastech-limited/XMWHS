// src/hooks/useSignUp.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerParent } from '../services';
import { validateEmail, validatePassword, isAxiosError } from '../utils/validators';
import type { ParentRegistrationRequest } from '../types/auth';

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

interface SignUpFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  termsAccepted: string;
}

export const useSignUp = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'parent',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<SignUpFormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    termsAccepted: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      isValid = false;
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the privacy and policy to proceed';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) return;

    // Additional password strength check
    const weakPassword = !validatePassword(formData.password);
    if (weakPassword) {
      setErrorMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const registrationData: ParentRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        termsAccepted: formData.termsAccepted,
      };

      const result = await registerParent(registrationData);

      if (result.user || result.message === "Registration successful") {
        setSuccessMessage(result.message || 'Account created successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'parent',
          password: '',
          confirmPassword: '',
          termsAccepted: false,
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);

      let userMessage = 'Something went wrong. Please try again.';

      if (isAxiosError(error) && error.response?.data?.message) {
        userMessage = error.response.data.message;
      } else if (error instanceof Error) {
        userMessage = error.message;
      }

      setErrorMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    showPassword,
    errorMessage,
    successMessage,
    isLoading,
    setShowPassword,
    handleChange,
    handleSubmit,
  };
};