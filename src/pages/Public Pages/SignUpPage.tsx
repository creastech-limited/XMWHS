import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle, School } from 'lucide-react';
import { registerParent } from '../../services';
import type { ParentRegistrationRequest } from '../../types/auth';
import bgImage from '../bg.jpeg';
import logo from '/5.png';

const SignUpPage: React.FC = () => {

  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'parent',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    termsAccepted: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // STRICT AXIOS TYPE CHECKER — NO ANY USED
  function isAxiosError(
    error: unknown
  ): error is AxiosError<{ message: string }> {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormValues({
      ...formValues,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = { ...formErrors };

    if (!formValues.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formValues.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formValues.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formValues.role) {
      errors.role = 'Please select a role';
      isValid = false;
    }

    if (!formValues.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formValues.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formValues.password !== formValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!formValues.termsAccepted) {
      errors.termsAccepted = 'You must accept the privacy and policy to proceed';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) return;

    const weakPassword =
      formValues.password.length < 8 ||
      !/[A-Z]/.test(formValues.password) ||
      !/[a-z]/.test(formValues.password) ||
      !/[0-9]/.test(formValues.password) ||
      !/[!@#$%^&*()_+=-]/.test(formValues.password);

    if (weakPassword) {
      setErrorMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    setLoading(true);

    const { firstName, lastName, email, password, role } = formValues;

    try {
      const registrationData: ParentRegistrationRequest = {
        firstName,
        lastName,
        email,
        password,
        role,
        termsAccepted: formValues.termsAccepted,
      };

      const result = await registerParent(registrationData);

      if (result.user || result.message === "Registration successful") {
        setErrorMessage('');
        setSuccessMessage(result.message || 'Account created successfully!');
        setFormValues({
          firstName: '',
          lastName: '',
          email: '',
          role: 'parent',
          password: '',
          confirmPassword: '',
          termsAccepted: false,
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setSuccessMessage('');
        setErrorMessage(result.message || 'Registration failed');
      }
    } catch (error: unknown) {
      setSuccessMessage('');
      console.error('Registration error:', error);

      let userMessage = 'Something went wrong. Please try again.';

      if (isAxiosError(error) && error.response?.data?.message) {
        userMessage = error.response.data.message;
      } else if (error instanceof Error) {
        userMessage = error.message;
      }

      setErrorMessage(userMessage);
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

      <div className="bg-white bg-opacity-95 p-8 rounded-xl shadow-2xl z-10 w-full max-w-md backdrop-blur-md">

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-indigo-900">Create Your Account</h1>

          <p className="text-gray-600">
            Already have an account?{' '}
            <RouterLink to="/login" className="text-indigo-700 font-semibold hover:underline">
              Sign In
            </RouterLink>
          </p>
        </div>

        {/* CORRECTED ALERT UI */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-500 text-green-900 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 shadow-sm">
            <CheckCircle size={18} className="text-green-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}
        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2 space-y-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  name="firstName"
                  value={formValues.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-3 pl-10 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg text-black`}
                />
              </div>

              {formErrors.firstName && (
                <p className="text-red-600 text-sm">{formErrors.firstName}</p>
              )}
            </div>

            <div className="w-1/2 space-y-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-3 pl-10 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg text-black`}
                />
              </div>

              {formErrors.lastName && (
                <p className="text-red-600 text-sm">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input
                name="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={`w-full px-4 py-3 pl-10 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-black`}
              />
            </div>

            {formErrors.email && (
              <p className="text-red-600 text-sm">{formErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <School size={18} />
              </div>

              <select
                name="role"
                value={formValues.role}
                disabled
                className={`w-full px-4 py-3 pl-10 border ${formErrors.role ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-black bg-white`}
              >
                <option value="parent">Parent</option>
              </select>
            </div>

            {formErrors.role && (
              <p className="text-red-600 text-sm">{formErrors.role}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>

              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full px-4 py-3 pl-10 pr-12 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-black`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {formErrors.password && (
              <p className="text-red-600 text-sm">{formErrors.password}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>

              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 pl-10 pr-12 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-black`}
              />
            </div>

            {formErrors.confirmPassword && (
              <p className="text-red-600 text-sm">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formValues.termsAccepted}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700 text-sm">
                I confirm that I have read and agree to the{' '}
                <a href="/privacyAndPolicy" target="_blank" className="text-indigo-700 underline">
                  Privacy and Policy of Xpay
                </a>
              </span>
            </label>

            {formErrors.termsAccepted && (
              <p className="text-red-600 text-sm">{formErrors.termsAccepted}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-900 text-white py-3 rounded-lg hover:bg-indigo-800 disabled:opacity-70"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;