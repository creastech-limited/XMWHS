import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  School, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import bgImage from './bg.jpeg';

// TypeScript interfaces
interface Class {
  _id: string;
  className: string;
  section: string;
  schoolId: string;
  students: string[];
  createdAt: string;
  updatedAt: string;
}

interface SchoolInfo {
  _id: string;
  schoolName: string;
  schoolType: string;
  ownership: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  password: string;
  confirmPassword: string;
  school: string;
  schoolName: string;
  schoolAddress: string;
  agreeToTerms: boolean;
  phone: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const StudentRegistrationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get school information from URL parameters
  const schoolId = searchParams.get("schoolId") || "";
  const schoolName = searchParams.get("schoolName") || "";
  const schoolAddress = searchParams.get("schoolAddress") || "";

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    grade: "",
    password: "",
    confirmPassword: "",
    phone: "+234", // Default Nigerian country code
    school: schoolId,
    schoolName: schoolName,
    schoolAddress: schoolAddress,
    agreeToTerms: false
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [classesLoading, setClassesLoading] = useState<boolean>(true);
  const [schoolLoading, setSchoolLoading] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://nodes-staging.up.railway.app";

  // Fetch school information
  useEffect(() => {
    if (!schoolId) {
      setSnackbar({
        open: true,
        message: "Invalid school registration link - missing school ID",
        severity: "error"
      });
      return;
    }

    const fetchSchoolInfo = async () => {
      try {
        setSchoolLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/users/getschoolbyid?id=${schoolId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            setSchoolInfo({
              _id: data.data._id,
              schoolName: data.data.schoolName || "Unknown School",
              schoolType: data.data.schoolType || "secondary",
              ownership: data.data.ownership || "private"
            });

            setFormData(prev => ({
              ...prev,
              schoolName: data.data.schoolName || schoolName,
              schoolAddress: data.data.schoolAddress || schoolAddress,
              school: data.data._id // Ensure we use the correct school ID
            }));
          }
        } else {
          // If API fails, use URL params
          setSchoolInfo({
            _id: schoolId,
            schoolName: schoolName || "Unknown School",
            schoolType: "secondary",
            ownership: "private"
          });
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
        // Fallback to URL params if API fails
        setSchoolInfo({
          _id: schoolId,
          schoolName: schoolName || "Unknown School",
          schoolType: "secondary",
          ownership: "private"
        });
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchoolInfo();
  }, [schoolId, schoolName, schoolAddress, API_BASE_URL]);

  // Fetch classes for the school
  useEffect(() => {
    if (!schoolId) return;

    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/users/getclasse?schoolId=${schoolId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch classes');
        }

        const data = await response.json();
        
        if (data.status && Array.isArray(data.data)) {
          // Filter classes by schoolId (should already be filtered by the API)
          const schoolClasses = data.data.filter((cls: Class) => cls.schoolId === schoolId);
          setClasses(schoolClasses);

          // Infer school type if not available
          if (schoolClasses.length > 0 && schoolInfo) {
            const classNames: string[] = schoolClasses.map((cls: Class) => cls.className.toLowerCase());
            let inferredType = "secondary";
            
            if (classNames.some(name => name.includes("year") || name.includes("primary") || name.includes("nursery"))) {
              inferredType = "primary";
            }

            setSchoolInfo(prev => prev ? { ...prev, schoolType: inferredType } : null);
          }
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setSnackbar({
          open: true,
          message: "Failed to load available classes",
          severity: "error"
        });
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [schoolId, schoolInfo, API_BASE_URL]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const { firstName, lastName, email, grade, password, confirmPassword, phone, agreeToTerms } = formData;
    
    if (!firstName || !lastName || !email || !grade || !password || !confirmPassword || !phone) {
      setSnackbar({ open: true, message: "All fields are required", severity: "error" });
      return false;
    }
    
    if (!email.includes('@')) {
      setSnackbar({ open: true, message: "Please enter a valid email address", severity: "error" });
      return false;
    }
    
    if (password.length < 8) {
      setSnackbar({ open: true, message: "Password must be at least 8 characters long", severity: "error" });
      return false;
    }
    
    if (password !== confirmPassword) {
      setSnackbar({ open: true, message: "Passwords do not match", severity: "error" });
      return false;
    }
    
    if (!formData.school) {
      setSnackbar({ open: true, message: "Invalid school registration link", severity: "error" });
      return false;
    }
    
    if (!agreeToTerms) {
      setSnackbar({ open: true, message: "Please agree to the Terms and Conditions", severity: "error" });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: "student",
      password: formData.password,
      academicDetails: {
        classAdmittedTo: formData.grade
      },
      schoolId: formData.school // Make sure this matches the API expectation
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setSnackbar({ 
          open: true, 
          message: result.message || "Registration failed", 
          severity: "error" 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: result.message || "Registration successful! Redirecting...", 
          severity: "success" 
        });
        setTimeout(() => {
          navigate('/students');
        }, 2000);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setSnackbar({ 
        open: true, 
        message: "An error occurred. Please try again.", 
        severity: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSchoolTypeIcon = (schoolType: string) => {
    switch (schoolType?.toLowerCase()) {
      case "primary":
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "secondary":
        return <GraduationCap className="h-4 w-4 text-purple-600" />;
      case "tertiary":
        return <School className="h-4 w-4 text-green-600" />;
      default:
        return <School className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSnackbarIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSnackbarColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Returns a Tailwind text color class based on school type
  const getSchoolTypeColor = (schoolType: string) => {
    switch (schoolType?.toLowerCase()) {
      case "primary":
        return "text-blue-600";
      case "secondary":
        return "text-purple-600";
      case "tertiary":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Registration</h1>
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
              <School className="h-4 w-4" />
              <span className="text-sm">School ID: <span className="font-semibold text-blue-600">{schoolId}</span></span>
            </div>
            {schoolInfo && (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                {getSchoolTypeIcon(schoolInfo.schoolType)}
                <span className={`text-sm font-medium ${getSchoolTypeColor(schoolInfo.schoolType)}`}>
                  {schoolInfo.schoolName}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 capitalize">
                  {schoolInfo.schoolType} School
                </span>
              </div>
            )}
            {schoolLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm">Loading school information...</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your school email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  disabled={classesLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {classesLoading ? "Loading classes..." : "Select your class"}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>
                      {cls.className} - Section {cls.section}
                    </option>
                  ))}
                </select>
              </div>
              {classes.length === 0 && !classesLoading && (
                <p className="text-sm text-red-500 mt-1">No classes available for this school</p>
              )}
            </div>

            {/* School ID (Read-only) */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                School ID
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={formData.school}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Automatically assigned based on your registration link</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                I confirm that I have read and agree to the{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                  Terms and Conditions
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || classesLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Register Student
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 z-50 py-3 px-6 rounded-lg shadow-lg ${getSnackbarColor(snackbar.severity)} text-white transition-all duration-300 ease-in-out max-w-md`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSnackbarIcon(snackbar.severity)}
              <span className="font-medium">{snackbar.message}</span>
            </div>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationForm;