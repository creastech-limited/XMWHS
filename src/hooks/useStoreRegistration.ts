// src/hooks/useStoreRegistration.ts
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { registerStore } from '../services';
import { 
  validateEmail, 
  validateName,
  validatePasswordField,
  validateConfirmPassword,
  isAxiosError 
} from '../utils/validators';
import type { StoreRegistrationRequest } from '../types/auth';
import type { 
  StoreRegistrationFormData,
  StoreRegistrationFormErrors 
} from '../types/registration';

export const useStoreRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const schoolId = searchParams.get("schoolId") || "";
  const displaySchool = searchParams.get("schoolName") || "";

  // Available options
  const locations = ['Block A', 'Block B', 'Block C', 'Block D'];
  const storeTypes = ['Cafeteria', 'Bookstore', 'Uniform', 'Supplies'];
  const steps = ['Store Information', 'Contact Details', 'Security'];

  const [formData, setFormData] = useState<StoreRegistrationFormData>({
    firstName: '',
    lastName: '',
    storeName: '',
    storeType: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    description: ''
  });

  const [errors, setErrors] = useState<StoreRegistrationFormErrors>({
    firstName: '',
    lastName: '',
    storeName: '',
    storeType: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    description: ''
  });

  const [activeStep, setActiveStep] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'warning' | 'info' 
  }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validateStep = (step: number): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    // Step 0: Store Information
    if (step === 0) {
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

      // Store name validation
      if (!formData.storeName.trim()) {
        newErrors.storeName = 'Store name is required';
        isValid = false;
      }

      // Store type validation
      if (!formData.storeType) {
        newErrors.storeType = 'Store type is required';
        isValid = false;
      }

      // Description validation
      if (!formData.description.trim()) {
        newErrors.description = 'Store description is required';
        isValid = false;
      }
    }

    // Step 1: Contact Details
    if (step === 1) {
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

      // Location validation
      if (!formData.location) {
        newErrors.location = 'Location is required';
        isValid = false;
      }
    }

    // Step 2: Security
    if (step === 2) {
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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (field: keyof StoreRegistrationFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      // Show error snackbar with validation message
      const errorMessages = Object.values(errors).filter(err => err);
      if (errorMessages.length > 0) {
        setSnackbar({
          open: true,
          message: errorMessages[0],
          severity: 'error'
        });
      }
      return;
    }

    if (activeStep === steps.length - 1) {
      handleSubmit(e);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      const registrationData: StoreRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: "store",
        storeName: formData.storeName,
        storeType: formData.storeType,
        phone: formData.phone,
        location: formData.location,
        description: formData.description,
        schoolId: schoolId,
        schoolName: displaySchool,
        school: schoolId,
      };

      const result = await registerStore(registrationData);

      if (result.user || result.message === 'Registration successful') {
        setSnackbar({
          open: true,
          message: result.message || `Store "${formData.storeName}" registered successfully!`,
          severity: "success"
        });
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 800);
      } else {
        setSnackbar({
          open: true,
          message: result.message || "Registration failed",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      
      let message = "Network error. Please check your connection and try again.";
      if (isAxiosError(error)) {
        message = error.response?.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      setSnackbar({
        open: true,
        message,
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return {
    formData,
    errors,
    activeStep,
    isSubmitting,
    snackbar,
    showPassword,
    locations,
    storeTypes,
    steps,
    displaySchool,
    setShowPassword,
    handleChange,
    handleNext,
    handleBack,
    closeSnackbar,
    navigate,
  };
};