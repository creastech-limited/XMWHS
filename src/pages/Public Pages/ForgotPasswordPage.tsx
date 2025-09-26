import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import logo from '../5.png';
import bgImage from '../bg.jpeg';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const validateForm = () => {
    if (!email) {
      setFormError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (formError) {
      setFormError('');
    }
    if (errorMessage) {
      setErrorMessage('');
    }
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'skip-browser-warning',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || 'Failed to send reset link. Please try again.');
      } else {
        setMessage('Password reset link has been sent to your email!');
        setEmail('');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Enter your email address and we'll send you a link to reset your password.
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
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Email address"
                className={`w-full pl-10 pr-4 py-3 border ${
                  formError ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="email-error"
                disabled={isLoading}
              />
            </div>
            {formError && (
              <p id="email-error" className="text-red-600 text-sm ml-1">{formError}</p>
            )}
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
                Sending...
              </span>
            ) : (
              'Send Reset Link'
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

export default ForgotPasswordPage;