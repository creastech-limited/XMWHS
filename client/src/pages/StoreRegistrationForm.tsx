import React, { useState } from 'react';
import type { JSX } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Store, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock,
  Building,
  AlertCircle,
  X
} from 'lucide-react';

import bgImage from './bg.jpeg';

// API Base URL
const API_BASE_URL = 'https://nodes-staging-xp.up.railway.app';

// Define steps for the stepper
const steps = ['Store Information', 'Contact Details', 'Security'];

// Define available locations for the dropdown
const locations = ['Block A', 'Block B', 'Block C', 'Block D'];

// Define store types
const storeTypes = ['Cafeteria', 'Bookstore', 'Uniform', 'Supplies'];

// TypeScript interfaces
interface FormData {
  firstName: string;
  lastName: string;
  storeName: string;
  storeType: string;
  email: string;
  phone: string;
  location: string;
  password: string;
  confirmPassword: string;
  description: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Move InputField component outside of the main component to prevent re-renders
const InputField: React.FC<{
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}> = ({ label, type = "text", name, value, onChange, required = false, icon, error = false, helperText, placeholder }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black placeholder-gray-500 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      />
    </div>
    {helperText && (
      <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
        {helperText}
      </p>
    )}
  </div>
);

// Move SelectField component outside
const SelectField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, name, value, onChange, options, required = false, icon }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        aria-label={label}
        className={`w-full px-4 py-3 ${icon ? 'pl-12' : ''} border border-gray-300 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400 text-black`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  </div>
);

// Move TextareaField component outside
const TextareaField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}> = ({ label, name, value, onChange, required = false, rows = 4, placeholder }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-400 resize-none text-black placeholder-gray-500"
    />
  </div>
);

const StoreRegistrationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const schoolId = searchParams.get("schoolId") || "";
  const displaySchool = searchParams.get("schoolName") || "";

  const [formData, setFormData] = useState<FormData>({
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
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const isStepValid = (): boolean => {
    switch (activeStep) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.storeName && formData.storeType && formData.description);
      case 1:
        return !!(formData.email && formData.phone && formData.location);
      case 2:
        return !!(formData.password && formData.confirmPassword);
      default:
        return false;
    }
  };

  const handleNext = () => { 
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match!',
        severity: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
        
    const payload = {
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
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
          message: result.message || `Store "${formData.storeName}" registered successfully!`,
          severity: "success"
        });
        
        setFormData({
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
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setSnackbar({
        open: true,
        message: "Network error. Please check your connection and try again.",
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step: number): JSX.Element => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                required
                icon={<User size={20} />}
                placeholder="Enter your first name"
              />
              <InputField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
                icon={<User size={20} />}
                placeholder="Enter your last name"
              />
            </div>
            <InputField
              label="Store Name"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange('storeName')}
              required
              icon={<Store size={20} />}
              placeholder="Enter your store name"
            />
            <SelectField
              label="Store Type"
              name="storeType"
              value={formData.storeType}
              onChange={handleChange('storeType')}
              options={storeTypes}
              required
              icon={<Building size={20} />}
            />
            <TextareaField
              label="Store Description"
              name="description"
              value={formData.description}
              onChange={handleChange('description')}
              required
              placeholder="Describe your store and what products/services you offer..."
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              icon={<Mail size={20} />}
              placeholder="Enter your email address"
            />
            <InputField
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              required
              icon={<Phone size={20} />}
              placeholder="Enter your phone number"
            />
            <SelectField
              label="Store Location"
              name="location"
              value={formData.location}
              onChange={handleChange('location')}
              options={locations}
              required
              icon={<MapPin size={20} />}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange('password')}
              required
              icon={<Lock size={20} />}
              helperText="Password must be at least 8 characters"
              placeholder="Create a secure password"
            />
            <InputField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              icon={<Lock size={20} />}
              error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
              helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? "Passwords don't match" : 'Re-enter your password to confirm'}
              placeholder="Confirm your password"
            />
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-fixed bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage})`
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Store Registration</h1>
            {displaySchool && (
              <p className="text-gray-600 text-lg">
                Registering new store for <span className="font-semibold text-indigo-600">{displaySchool}</span>
              </p>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    index <= activeStep 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {index < activeStep ? (
                      <Check size={20} />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-4 hidden sm:block">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      index <= activeStep ? 'text-indigo-600' : 'text-gray-400'
                    }`}>
                      {step}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-24 h-1 mx-8 rounded transition-colors duration-300 ${
                      index < activeStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            {getStepContent(activeStep)}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={activeStep === 0 || isSubmitting}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeStep === 0 || isSubmitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
              }`}
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                !isStepValid() || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              <span>
                {isSubmitting 
                  ? 'Processing...' 
                  : (activeStep === steps.length - 1 ? 'Complete Registration' : 'Next')
                }
              </span>
              {activeStep === steps.length - 1 ? <Check size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Snackbar */}
      {snackbar.open && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
            snackbar.severity === 'success' 
              ? 'bg-green-500 text-white' 
              : snackbar.severity === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {snackbar.severity === 'error' && <AlertCircle size={20} />}
            {snackbar.severity === 'success' && <Check size={20} />}
            <span className="font-medium">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-2 hover:bg-black hover:bg-opacity-20 rounded-full p-1 transition-colors duration-200"
              aria-label="Close notification"
              title="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRegistrationForm;