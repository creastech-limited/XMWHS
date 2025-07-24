import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle, School } from 'lucide-react';
import bgImage from './bg.jpeg';
import logo from './5.png'; // Added logo import to match login page

const SignUpPage: React.FC = () => {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'parent', // Set default role
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    termsAccepted: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
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

  const validateForm = () => {
    let isValid = true;
    const errors = { ...formErrors };
    
    // First name validation
    if (!formValues.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }
    
    // Last name validation
    if (!formValues.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }
    
    // Email validation
    if (!formValues.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Role validation
    if (!formValues.role) {
      errors.role = 'Please select a role';
      isValid = false;
    }
    
    // Password validation
    if (!formValues.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formValues.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    // Confirm password validation
    if (formValues.password !== formValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Terms acceptance validation
    if (!formValues.termsAccepted) {
      errors.termsAccepted = 'You must accept the terms and conditions';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }

    // Check for weak password
    // Example: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const weakPassword =
      formValues.password.length < 8 ||
      !/[A-Z]/.test(formValues.password) ||
      !/[a-z]/.test(formValues.password) ||
      !/[0-9]/.test(formValues.password) ||
      !/[!@#$%^&*()_+=-]/.test(formValues.password);

    if (weakPassword) {
      setErrorMessage('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const { firstName, lastName, email, password, role } = formValues;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'skip-browser-warning'
        },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      setSuccessMessage(result.message || 'Account created successfully! You can now sign in.');
      
      // Reset form after successful submission
      setFormValues({
        firstName: '',
        lastName: '',
        email: '',
        role: 'parent',
        password: '',
        confirmPassword: '',
        termsAccepted: false
      });
      
    } catch (error: unknown) {
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

      <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl z-10 w-full max-w-md backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900 mb-1">Create Your Account</h1>
          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <RouterLink to="/login" className="text-indigo-700 font-semibold hover:underline transition-colors duration-200">
              Sign In
            </RouterLink>
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
                  <User size={18} />
                </div>
                <input
                  name="firstName"
                  type="text"
                  value={formValues.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-3 pl-10 border ${
                    formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                  aria-describedby="firstName-error"
                />
              </div>
              {formErrors.firstName && (
                <p id="firstName-error" className="text-red-600 text-sm ml-1">{formErrors.firstName}</p>
              )}
            </div>
            
            <div className="w-1/2 space-y-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  name="lastName"
                  type="text"
                  value={formValues.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-3 pl-10 border ${
                    formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                  aria-describedby="lastName-error"
                />
              </div>
              {formErrors.lastName && (
                <p id="lastName-error" className="text-red-600 text-sm ml-1">{formErrors.lastName}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={`w-full px-4 py-3 pl-10 border ${
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
                <School size={18} />
              </div>
              <select
                name="role"
                value={formValues.role}
                onChange={handleChange}
                className={`w-full px-4 py-3 pl-10 border ${
                  formErrors.role ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 appearance-none text-black bg-white`}
                aria-describedby="role-error"
              >
                <option value="" disabled>Select Role</option>
                <option value="parent">Parent</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {formErrors.role && (
              <p id="role-error" className="text-red-600 text-sm ml-1">{formErrors.role}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full px-4 py-3 pl-10 pr-12 border ${
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

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 pl-10 pr-12 border ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 text-black`}
                aria-describedby="confirmPassword-error"
              />
            </div>
            {formErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-red-600 text-sm ml-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                name="termsAccepted"
                checked={formValues.termsAccepted}
                onChange={handleChange}
                className={`w-4 h-4 ${
                  formErrors.termsAccepted ? 'border-red-500' : 'border-gray-300'
                } rounded focus:ring-indigo-500 text-indigo-600`}
                aria-describedby="terms-error"
              />
              <span className="text-gray-700 text-sm group-hover:text-indigo-700 transition-colors duration-200">
                I confirm that I have read and agree to the{' '}
                <a href="#" className="text-indigo-700 underline hover:text-indigo-900">Terms and Conditions</a>.
              </span>
            </label>
            {formErrors.termsAccepted && (
              <p id="terms-error" className="text-red-600 text-sm ml-1">{formErrors.termsAccepted}</p>
            )}
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
            <RouterLink to="/schoolsignup" className="text-indigo-700 font-medium hover:underline">
              School
            </RouterLink>
            {' '} instead
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;