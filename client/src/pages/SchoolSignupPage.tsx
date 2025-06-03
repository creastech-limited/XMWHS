import React, { useState } from 'react';
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
import { AlertCircle, CheckCircle } from 'react-feather';

type SchoolType = 'primary' | 'secondary' | 'polytechnic' | 'university';

const SignUpPage: React.FC = () => {
  const [role, setRole] = useState<string>('school');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [schoolType, setSchoolType] = useState<SchoolType>('primary');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value);
  };

  const handleSchoolTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSchoolType(event.target.value as SchoolType);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

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
      const response = await fetch(`${API_BASE_URL}/api/users/register2`, {
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
    <div
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0"></div>

      <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl z-10 w-full max-w-lg backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-indigo-100">
            <AcademicCapIcon className="w-12 h-12 text-indigo-900" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-1">School Registration</h1>
          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-700 font-semibold hover:underline transition-colors duration-200">
              Sign In
            </Link>
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-green-200">
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2 space-y-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                  required
                />
              </div>
            </div>
            
            <div className="w-1/2 space-y-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={handleRoleChange}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 appearance-none text-black bg-white"
                required
                aria-label="Role"
              >
                <option value="school">School</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <AcademicCapIcon className="h-5 w-5" />
              </div>
              <label htmlFor="schoolType" className="sr-only">School Type</label>
              <select
                id="schoolType"
                name="schoolType"
                value={schoolType}
                onChange={handleSchoolTypeChange}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 appearance-none text-black bg-white"
                required
                aria-label="School Type"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="polytechnic">Polytechnic</option>
                <option value="university">University</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <BuildingLibraryIcon className="h-5 w-5" />
              </div>
              <input
                name="schoolName"
                type="text"
                placeholder="School Name"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <input
                name="schoolAddress"
                type="text"
                placeholder="School Address"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <PhoneIcon className="h-5 w-5" />
              </div>
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
              <button
                type="button"
                onClick={handleClickShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                name="terms"
                required
                className="w-4 h-4 border-gray-300 rounded focus:ring-indigo-500 text-indigo-600"
              />
              <span className="text-gray-700 text-sm group-hover:text-indigo-700 transition-colors duration-200">
                I confirm that I have read and agree to the{' '}
                <a href="#" className="text-indigo-700 underline hover:text-indigo-900">Terms and Conditions</a>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-900 text-white py-3 px-4 rounded-lg hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Register as a{' '}
            <Link to="/signup" className="text-indigo-700 font-medium hover:underline">
              Parent
            </Link>
            {' '} instead
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;