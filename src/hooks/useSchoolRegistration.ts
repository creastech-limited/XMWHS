// src/hooks/useSchoolRegistration.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSchool } from '../services';
import { 
  validateEmail, 
  validateName,
  validatePasswordField,
  validateConfirmPassword,
  isAxiosError 
} from '../utils/validators';
import type { SchoolRegistrationRequest, SchoolType } from '../types/auth';
import type { 
  SchoolRegistrationFormData,
  SchoolRegistrationFormErrors 
} from '../types/registration';

export const useSchoolRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SchoolRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'school',
    schoolName: '',
    schoolAddress: '',
    phone: '',
    schoolType: 'primary',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<SchoolRegistrationFormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    schoolName: '',
    schoolAddress: '',
    phone: '',
    schoolType: '',
    password: '',
    confirmPassword: '',
    termsAccepted: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const schoolTypeOptions = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'polytechnic', label: 'Polytechnic' },
    { value: 'university', label: 'University' },
  ];

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: SchoolRegistrationFormErrors = {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      schoolName: '',
      schoolAddress: '',
      phone: '',
      schoolType: '',
      password: '',
      confirmPassword: '',
      termsAccepted: '',
    };

    // First name validation
    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) {
      newErrors.firstName = firstNameError;
      isValid = false;
    }

    // Last name validation
    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) {
      newErrors.lastName = lastNameError;
      isValid = false;
    }

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      isValid = false;
    }

    // School name validation
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
      isValid = false;
    }

    // School address validation
    if (!formData.schoolAddress.trim()) {
      newErrors.schoolAddress = 'School address is required';
      isValid = false;
    }

    // Phone validation
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Valid phone number is required';
      isValid = false;
    }

    // School type validation
    if (!formData.schoolType) {
      newErrors.schoolType = 'School type is required';
      isValid = false;
    }

    // Password validation
    const passwordError = validatePasswordField(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
      isValid = false;
    }

    // Confirm password validation
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
      isValid = false;
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must agree to the terms and conditions';
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
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SchoolRegistrationFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const registrationData: SchoolRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        schoolName: formData.schoolName,
        schoolAddress: formData.schoolAddress,
        phone: formData.phone,
        schoolType: formData.schoolType as SchoolType,
      };

      const result = await registerSchool(registrationData);

      if (result.user || result.message === 'Registration successful') {
        setSuccessMessage(result.message || 'School registered successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'school',
          schoolName: '',
          schoolAddress: '',
          phone: '',
          schoolType: 'primary',
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
      
      let message = 'Something went wrong. Please try again.';
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
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
    showPassword,
    errorMessage,
    successMessage,
    isLoading,
    schoolTypeOptions,
    setShowPassword,
    handleChange,
    handleSubmit,
  };
};