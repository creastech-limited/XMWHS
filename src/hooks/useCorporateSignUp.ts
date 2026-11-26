// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { registerStore } from '../services';
// import { validateEmail, validatePassword, isAxiosError } from '../utils/validators';
// import type { StoreRegistrationRequest } from '../types/auth';

// interface CorporateFormData {
//   businessName: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
//   termsAccepted: boolean;
// }

// type CorporateFormErrors = Record<keyof CorporateFormData, string>;

// const initialData: CorporateFormData = {
//   businessName: '',
//   firstName: '',
//   lastName: '',
//   email: '',
//   password: '',
//   confirmPassword: '',
//   termsAccepted: false,
// };

// const initialErrors = Object.fromEntries(
//   Object.keys(initialData).map((k) => [k, ''])
// ) as CorporateFormErrors;

// export const useCorporateSignUp = () => {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState<CorporateFormData>(initialData);
//   const [errors, setErrors] = useState<CorporateFormErrors>(initialErrors);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const validateForm = (): boolean => {
//     const newErrors: CorporateFormErrors = { ...initialErrors };
//     let isValid = true;

//     if (!formData.businessName.trim()) {
//       newErrors.businessName = 'Business name is required';
//       isValid = false;
//     }
//     if (!formData.firstName.trim()) {
//       newErrors.firstName = 'First name is required';
//       isValid = false;
//     }
//     if (!formData.lastName.trim()) {
//       newErrors.lastName = 'Last name is required';
//       isValid = false;
//     }

//     const emailError = validateEmail(formData.email);
//     if (emailError) {
//       newErrors.email = emailError;
//       isValid = false;
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//       isValid = false;
//     } else if (formData.password.length < 8) {
//       newErrors.password = 'Password must be at least 8 characters';
//       isValid = false;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//       isValid = false;
//     }

//     if (!formData.termsAccepted) {
//       newErrors.termsAccepted = 'You must accept the privacy and policy to proceed';
//       isValid = false;
//     }

//     setErrors(newErrors);
//     return isValid;
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

//     setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

//     if (errors[name as keyof CorporateFormErrors]) {
//       setErrors((prev) => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrorMessage('');
//     setSuccessMessage('');

//     if (!validateForm()) return;

//     if (!validatePassword(formData.password)) {
//       setErrorMessage(
//         'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
//       );
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const payload: StoreRegistrationRequest = {
//         businessName: formData.businessName,
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.email,
//         password: formData.password,
//         termsAccepted: formData.termsAccepted,
//       };

//       const result = await registerStore(payload);

//       if (result.user || result.message === 'Registration successful') {
//         setSuccessMessage(result.message || 'Account created successfully!');
//         setFormData(initialData);
//         setTimeout(() => navigate('/login'), 2000);
//       } else {
//         setErrorMessage(result.message || 'Registration failed');
//       }
//     } catch (error) {
//       console.error('Corporate registration error:', error);

//       let userMessage = 'Something went wrong. Please try again.';
//       if (isAxiosError(error) && error.response?.data?.message) {
//         userMessage = error.response.data.message;
//       } else if (error instanceof Error) {
//         userMessage = error.message;
//       }
//       setErrorMessage(userMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return {
//     formData,
//     errors,
//     showPassword,
//     errorMessage,
//     successMessage,
//     isLoading,
//     setShowPassword,
//     handleChange,
//     handleSubmit,
//   };
// };