import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  BuildingLibraryIcon, 
  MapPinIcon, 
  PhoneIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import bgImage from './bg.jpeg';

type SchoolType = 'primary' | 'secondary' | 'polytechnic' | 'university';

const SignUpPage: React.FC = () => {
  const [role, setRole] = useState<string>('school');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [schoolType, setSchoolType] = useState<SchoolType>('primary');

  // Add useEffect to set the document body style
  useEffect(() => {
    // Save original styles
    const originalStyle = document.body.style.cssText;
    
    // Apply styles to ensure full coverage
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    
    // Apply styles to html as well
    document.documentElement.style.height = '100%';
    document.documentElement.style.width = '100%';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value);
  };

  const handleSchoolTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSchoolType(event.target.value as SchoolType);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const form = event.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      firstName: HTMLInputElement;
      lastName: HTMLInputElement;
      email: HTMLInputElement;
      password: HTMLInputElement;
      schoolName: HTMLInputElement;
      schoolAddress: HTMLInputElement;
      phone: HTMLInputElement;
    };

    const firstName = formElements.firstName.value.trim();
    const lastName = formElements.lastName.value.trim();
    const email = formElements.email.value.trim();
    const password = formElements.password.value;
    const schoolName = formElements.schoolName.value.trim();
    const schoolAddress = formElements.schoolAddress.value.trim();
    const phone = formElements.phone.value.trim();

    if (!firstName || !lastName || !email || !password || !role || !schoolName || !schoolAddress || !phone || !schoolType) {
      setErrorMessage('All fields are required.');
      setLoading(false);
      return;
    }

    // Prepare data
    const data = { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      schoolName, 
      schoolAddress, 
      phone,
      schoolType 
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'skip-browser-warning',
        },
        body: JSON.stringify(data)
      });
    
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Registration failed');
      }

      const result = await response.json();
      setSuccessMessage(result.message || 'User registered successfully');
      form.reset();
      setRole('school');
      setSchoolType('primary');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Inline styles for html and body */}
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: auto;
        }
      `}</style>
      
      <div 
        className="min-h-screen w-full flex items-center justify-center py-8 px-4 relative"
        style={{ 
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          width: '100%',
          minHeight: '100vh'
        }}
      >
        {/* Dark overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
      
      <div className="w-full max-w-lg relative z-10 my-8">
        <div className="bg-white bg-opacity-95 rounded-xl shadow-xl p-8 backdrop-blur-md transform transition-all duration-500 hover:scale-[1.01] border border-indigo-100">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-900 mb-2">School Registration</h1>
            <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full mb-4"></div>
            <p className="mt-2 text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors hover:underline">
                Sign In
              </Link>
            </p>
          </div>

                      {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm animate-fadeIn">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm animate-fadeIn">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2"
                    required
                  />
                </div>
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type="email"
                  id="email"
                  name="email"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-500" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={handleRoleChange}
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 appearance-none transition-all duration-300"
                  required
                >
                  <option value="school">School</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* School Type */}
            <div>
              <label htmlFor="schoolType" className="block text-sm font-medium text-gray-700 mb-1">
                School Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AcademicCapIcon className="h-5 w-5 text-gray-500" />
                </div>
                <select
                  id="schoolType"
                  name="schoolType"
                  value={schoolType}
                  onChange={handleSchoolTypeChange}
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 appearance-none transition-all duration-300"
                  required
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="polytechnic">Polytechnic</option>
                  <option value="university">University</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* School Name */}
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingLibraryIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* School Address */}
            <div>
              <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-1">
                School Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type="text"
                  id="schoolAddress"
                  name="schoolAddress"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={handleClickShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                                  <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent py-2 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={handleClickShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  I confirm that I have read the Terms and Conditions.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

                          <div className="text-center">
              <p className="text-gray-600">
                Register as a{' '}
                <Link to="/signup" className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors hover:underline">
                  Parent
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default SignUpPage;