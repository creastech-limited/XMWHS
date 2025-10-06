import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import logo from '../5.png';
import bgImage from '../bg.jpeg';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [formErrors, setFormErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    console.log('Token validation effect running');
    console.log('Token value:', token);
    console.log('Token type:', typeof token);
    
    if (!token || token.trim() === '') {
      console.log('Token is invalid or missing');
      setIsTokenValid(false);
      setErrorMessage('Invalid or missing reset token.');
      return;
    }
    
    console.log('Token appears valid, proceeding...');
    
    
    if (token.length < 10) {
      
      setIsTokenValid(false);
      setErrorMessage('Invalid reset token format.');
      return;
    }
    
    // Token is valid
    setIsTokenValid(true);
    
  }, [token]);

  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  };

  const validateForm = () => {
    let isValid = true;
    const errors = { newPassword: '', confirmPassword: '' };
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (!validatePassword(newPassword)) {
      errors.newPassword = 'Password must meet all requirements below';
      isValid = false;
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'newPassword') setNewPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    
    // Clear errors when user starts typing
    if (formErrors.newPassword || formErrors.confirmPassword) {
      setFormErrors({ newPassword: '', confirmPassword: '' });
    }
    if (errorMessage) setErrorMessage('');
    if (message) setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
   
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const apiUrl = `${API_BASE_URL}/api/users/reset-password/${token}`;
      console.log('Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'skip-browser-warning',
        },
        body: JSON.stringify({ password: newPassword }), 
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Failed to reset password. The link may have expired.');
        if (response.status === 400 || response.status === 410) {
          setIsTokenValid(false);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'Number', met: /\d/.test(newPassword) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];

  // Debug render
  console.log('Rendering component. isTokenValid:', isTokenValid);

  // Show invalid token page ONLY when token is NOT valid
  if (!isTokenValid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />
        
        <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 border-4 border-indigo-100">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-indigo-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6 text-center">
              This password reset link is invalid or has expired.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-6 text-center">
            <RouterLink
              to="/forgot-password"
              className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors duration-200 inline-block"
            >
              Request New Reset Link
            </RouterLink>
          </div>
        </div>
      </div>
    );
  }

  // Show reset form when token IS valid
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />

      <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600 mb-6 text-center">
            Enter your new password below.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-green-200">
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                placeholder="New password"
                className={`w-full pl-10 pr-12 py-3 border ${
                  formErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="newPassword-error"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.newPassword && (
              <p id="newPassword-error" className="text-red-600 text-sm ml-1">{formErrors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                className={`w-full pl-10 pr-12 py-3 border ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="confirmPassword-error"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-red-600 text-sm ml-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
            <ul className="space-y-2">
              {passwordRequirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                  <span className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-600'}`}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-900 text-white py-3 px-4 rounded-lg hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 focus:outline-none transition transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <RouterLink
            to="/login"
            className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors duration-200 inline-block"
          >
            Back to Login
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;