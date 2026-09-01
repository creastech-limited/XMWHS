// src/hooks/useStudentRegistration.ts
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { registerStudent, getSchoolById } from '../services';
import { 
  validateEmail, 
  validateName,
  validatePasswordField,
  validateConfirmPassword,
  isAxiosError 
} from '../utils/validators';
import type { 
  StudentRegistrationRequest, 
  SchoolInfoResponse,
  RegistrationResponse 
} from '../types/auth';
import type { 
  StudentRegistrationFormData,
  RegistrationFormErrors,
  SchoolInfo
} from '../types/registration';

export const useStudentRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get URL parameters
  const schoolId = searchParams.get('schoolId')?.trim() || '';
  const schoolName = decodeURIComponent(searchParams.get('schoolName')?.trim() || '');
  const schoolType = decodeURIComponent(searchParams.get('schoolType')?.trim() || '');
  const schoolAddress = decodeURIComponent(searchParams.get('schoolAddress')?.trim() || '');

  // State
  const [formData, setFormData] = useState<StudentRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    classAdmittedTo: '',
    password: '',
    confirmPassword: '',
    phone: '+234',
    schoolId,
    schoolName,
    schoolType,
    schoolAddress,
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<RegistrationFormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    classAdmittedTo: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: '',
  });

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolNotFound, setSchoolNotFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch school information
  useEffect(() => {
    if (!schoolId) {
      setSchoolNotFound(true);
      setSchoolLoading(false);
      setErrorMessage('Invalid registration link. Missing school identification.');
      return;
    }

    const fetchSchoolInfo = async () => {
      try {
        setSchoolLoading(true);
        
        const result: SchoolInfoResponse = await getSchoolById(schoolId);

        if (result.success && result.data) {
          const data = result.data;
          
          setSchoolInfo({
            _id: data._id,
            schoolName: data.schoolName || schoolName,
            schoolType: data.schoolType || schoolType,
            schoolAddress: data.schoolAddress || schoolAddress,
            classes: data.classes || [],
          });

          // Update form data with verified school info
          setFormData(prev => ({
            ...prev,
            schoolName: data.schoolName || schoolName,
            schoolType: data.schoolType || schoolType,
            schoolAddress: data.schoolAddress || schoolAddress,
          }));
        } else {
          throw new Error(result.message || 'Invalid school data received');
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
        
        let message = 'Error loading school information.';
        if (isAxiosError(error)) {
          message = error.response?.data?.message || message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        
        setErrorMessage(message);
        setSchoolNotFound(true);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchoolInfo();
  }, [schoolId, schoolName, schoolType, schoolAddress]);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: RegistrationFormErrors = {
      firstName: '',
      lastName: '',
      email: '',
      classAdmittedTo: '',
      password: '',
      confirmPassword: '',
      phone: '',
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

    // Class validation
    if (!formData.classAdmittedTo) {
      newErrors.classAdmittedTo = 'Please select a class';
      isValid = false;
    }

    // Password validation - using validatePasswordField instead of validatePassword
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
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof RegistrationFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const registrationData: StudentRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        password: formData.password,
        academicDetails: {
          classAdmittedTo: formData.classAdmittedTo,
        },
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
         schoolType: formData.schoolType as 'primary' | 'secondary' | 'polytechnic' | 'university',
        schoolAddress: formData.schoolAddress,
      };

      const result: RegistrationResponse = await registerStudent(registrationData);

      if (result.user || result.message === 'Registration successful') {
        setSuccessMessage(result.message || 'Registration successful! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErrorMessage(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let message = 'Registration failed. Please try again.';
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
    errors,
    schoolInfo,
    schoolLoading,
    schoolNotFound,
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,
    successMessage,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    navigate,
  };
};