import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  BookOpen,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import bgImage from '../bg.jpeg';
import { registerStudent, getSchoolById } from '../../services';
import type { 
  StudentRegistrationRequest, 
  SchoolInfoResponse,
  RegistrationResponse 
} from '../../types/auth';

interface ClassInfo {
  className: string;
  section: string;
}

interface SchoolInfo {
  _id: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
  classes: ClassInfo[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  classAdmittedTo: string;
  password: string;
  confirmPassword: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
  agreeToTerms: boolean;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const StudentRegistrationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get URL parameters
  const schoolId = searchParams.get('schoolId')?.trim() || ''; 
  const schoolName = decodeURIComponent(searchParams.get('schoolName')?.trim() || '');
  const schoolType = decodeURIComponent(searchParams.get('schoolType')?.trim() || '');
  const schoolAddress = decodeURIComponent(searchParams.get('schoolAddress')?.trim() || '');

  const [formData, setFormData] = useState<FormData>({
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

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolNotFound, setSchoolNotFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch school information
  useEffect(() => {
    if (!schoolId) {
      setSnackbar({
        open: true,
        message: 'Invalid registration link. Missing school identification.',
        severity: 'error',
      });
      setSchoolNotFound(true);
      setSchoolLoading(false);
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
      } catch (error: unknown) {
        console.error('Error fetching school info:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error loading school information.';
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        setSchoolNotFound(true);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchoolInfo();
  }, [schoolId, schoolName, schoolType, schoolAddress]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = (): boolean => {
    // Check required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 
      'classAdmittedTo', 'password', 'confirmPassword', 'phone'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormData]);
    if (missingFields.length > 0) {
      setSnackbar({
        open: true,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        severity: 'error',
      });
      return false;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error',
      });
      return false;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        severity: 'error',
      });
      return false;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error',
      });
      return false;
    }

    // Check terms agreement
    if (!formData.agreeToTerms) {
      setSnackbar({
        open: true,
        message: 'You must agree to the terms and conditions',
        severity: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

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
        schoolType: formData.schoolType,
        schoolAddress: formData.schoolAddress,
      };

      const result: RegistrationResponse = await registerStudent(registrationData);

      // Assuming your API returns a success flag or message
      if (result.success || result.message?.includes('success')) {
        setSnackbar({
          open: true,
          message: result.message || 'Registration successful! Redirecting...',
          severity: 'success',
        });
        
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Registration failed',
          severity: 'error',
        });
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.';
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (schoolNotFound) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Registration Link</h1>
          <p className="text-gray-600 mb-6">
            The registration link is invalid or expired. Please contact your school administrator for assistance.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 w-full max-w-lg bg-white/95 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Registration</h1>
          
          {schoolInfo ? (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-blue-600">{schoolInfo.schoolName}</h2>
              <p className="text-gray-600 capitalize">{schoolInfo.schoolType} School</p>
              {schoolInfo.schoolAddress && (
                <p className="text-sm text-gray-500">{schoolInfo.schoolAddress}</p>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="classAdmittedTo"
                value={formData.classAdmittedTo}
                onChange={handleChange}
                required
                disabled={schoolLoading || !schoolInfo}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-black"
              >
                <option value="">Select Class</option>
                {schoolInfo?.classes.map((cls, index) => (
                  <option key={index} value={cls.className}>
                    {cls.className} {cls.section && `(${cls.section})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 mr-2"
            />
            <label className="text-sm text-gray-700">
              I agree to the Terms and Conditions
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || schoolLoading || schoolNotFound}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>
        </form>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
          snackbar.severity === 'success' ? 'bg-green-500' : 
          snackbar.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center">
            {snackbar.severity === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
            <span>{snackbar.message}</span>
            <button 
              onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationForm;