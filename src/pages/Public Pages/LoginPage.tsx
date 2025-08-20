import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import logo from './5.png';
import bgImage from './bg.jpeg';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });

  const authContext = useAuth();
  if (!authContext) {
    throw new Error('AuthContext is undefined. Ensure you are using AuthProvider.');
  }
  const { login } = authContext;
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const validateForm = () => {
    let isValid = true;
    const errors = { email: '', password: '' };
    
    // Email validation
    if (!formValues.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (!formValues.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formValues.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'skip-browser-warning',
        },
        body: JSON.stringify({
          email: formValues.email,
          password: formValues.password,
          rememberMe: formValues.rememberMe
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || 'Login failed');
      } else {
        login(data.user, data.accessToken);
        const role = data.user?.role;
        switch (role) {
          case 'school':
            navigate('/schools');
            break;
          case 'parent':
            navigate('/parent');
            break;
          case 'student':
            navigate('/kidswallet');
            break;
          case 'store':
            navigate('/store');
            break;
          case 'agent':
            navigate('/agent');
            break;
            case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred. Please try again later.');
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
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-6">Please sign in to your account</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
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
                value={formValues.email}
                onChange={handleChange}
                placeholder="Email address"
                className={`w-full pl-10 pr-4 py-3 border ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="email-error"
              />
            </div>
            {formErrors.email && (
              <p id="email-error" className="text-red-600 text-sm ml-1">{formErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formValues.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full pl-10 pr-12 py-3 border ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="password-error"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p id="password-error" className="text-red-600 text-sm ml-1">{formErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input 
                type="checkbox" 
                name="rememberMe"
                checked={formValues.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 text-sm group-hover:text-indigo-700 transition-colors duration-200">Remember me</span>
            </label>
            <RouterLink
              to="/forgot-password"
              className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline transition-colors duration-200"
            >
              Forgot Password?
            </RouterLink>
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
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <RouterLink
            to="/signup"
            className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors duration-200 inline-block"
          >
            Don't have an account? <span className="font-bold underline">Sign Up</span>
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;