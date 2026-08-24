// src/hooks/useSecurityRegistration.ts
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSchoolById, registerSecurity } from '../services';
import { 
  validateEmail, 
  validateName,
  validateConfirmPassword,
  isAxiosError 
} from '../utils/validators';
import type { 
  RegistrationResponse, 
  SchoolInfoResponse, 
  SecurityRegistrationRequest 
} from '../types/auth';
import type { 
  SecurityRegistrationFormData,
  SecurityRegistrationFormErrors,
  SchoolInfo 
} from '../types/registration';

export const useSecurityRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const schoolId = searchParams.get('schoolId')?.trim() || '';
  const fallbackSchoolName = decodeURIComponent(searchParams.get('schoolName')?.trim() || '');
  const fallbackSchoolType = decodeURIComponent(searchParams.get('schoolType')?.trim() || '');
  const fallbackSchoolAddress = decodeURIComponent(searchParams.get('schoolAddress')?.trim() || '');

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SecurityRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+234',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Password strength check using useMemo
  const passwordIsStrong = useMemo(() => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(formData.password);
  }, [formData.password]);

  // Fetch school information
  useEffect(() => {
    if (!schoolId) {
      setErrorMessage('Invalid security signup link. Missing school identification.');
      setLoadingSchool(false);
      return;
    }

    const loadSchool = async () => {
      try {
        setLoadingSchool(true);
        const response: SchoolInfoResponse = await getSchoolById(schoolId);

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Could not load school information');
        }

        // Fix: Include classes array to match SchoolInfo type
        setSchoolInfo({
          _id: response.data._id,
          schoolName: response.data.schoolName || fallbackSchoolName,
          schoolType: response.data.schoolType || fallbackSchoolType,
          schoolAddress: response.data.schoolAddress || fallbackSchoolAddress,
          classes: response.data.classes || [], // Add this line
        });
      } catch (error) {
        console.error('Security school lookup failed', error);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load school information.');
      } finally {
        setLoadingSchool(false);
      }
    };

    loadSchool();
  }, [fallbackSchoolAddress, fallbackSchoolName, fallbackSchoolType, schoolId]);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: SecurityRegistrationFormErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: '',
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

    // Phone validation
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Valid phone number is required';
      isValid = false;
    }

    // Password validation - using passwordIsStrong from useMemo
    if (!passwordIsStrong) {
      newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
      isValid = false;
    }

    // Confirm password validation
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
      isValid = false;
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    // If there are errors, set the first one as the error message
    const errorMessages = Object.values(newErrors).filter(err => err);
    if (errorMessages.length > 0) {
      setErrorMessage(errorMessages[0]);
    }

    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData: SecurityRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'security',
        password: formData.password,
        schoolId,
        schoolName: schoolInfo?.schoolName || fallbackSchoolName,
        schoolType: schoolInfo?.schoolType || fallbackSchoolType,
        schoolAddress: schoolInfo?.schoolAddress || fallbackSchoolAddress,
      };

      const result: RegistrationResponse = await registerSecurity(registrationData);

      if (result.user || result.success || result.message === 'Registration successful') {
        setInfoMessage(result.message || 'Security account created successfully. Redirecting to login...');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '+234',
          password: '',
          confirmPassword: '',
          agreeToTerms: false,
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(result.message || 'Security registration failed.');
      }
    } catch (error) {
      console.error('Security registration failed', error);
      
      let message = 'Security registration failed. Please try again.';
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    schoolInfo,
    loadingSchool,
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,
    infoMessage,
    passwordIsStrong,
    fallbackSchoolName,
    fallbackSchoolType,
    fallbackSchoolAddress,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    navigate,
  };
};