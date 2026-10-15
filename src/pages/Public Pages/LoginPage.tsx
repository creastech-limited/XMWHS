import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import { FormInput } from '../../components/shared/FormInput';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { DownloadAppModal } from '../../components/shared/DownloadAppModal';
import logo from '/xpay.jpeg';
import bgImage from '../bg.jpeg';

const LoginPage: React.FC = () => {
  const {
    formData,
    errors,
    errorMessage,
    isLoading,
    showPassword,
    setShowPassword,
    showDownloadModal,
    setShowDownloadModal,
    handleChange,
    handleSubmit
  } = useLogin();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />

      <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        {/* Logo and Header */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-indigo-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-6">Please sign in to your account</p>
        </div>

        {/* Error Alert */}
        <ErrorAlert
          message={errorMessage}
          onDismiss={() => { }} // Optionally clear error
        />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            error={errors.email}
            icon={<Mail size={18} />}
          />

          <FormInput
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            error={errors.password}
            icon={<Lock size={18} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-indigo-700 focus:outline-none transition-colors duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Lock size={18} /> : <Lock size={18} />}
              </button>
            }
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 text-sm group-hover:text-indigo-700 transition-colors duration-200">
                Remember me
              </span>
            </label>
            <RouterLink
              to="/forgot-password"
              className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline transition-colors duration-200"
            >
              Forgot Password?
            </RouterLink>
          </div>

          <SubmitButton
            isLoading={isLoading}
            loadingText="Signing In..."
            defaultText="Sign In"
          />
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <RouterLink
            to="/signup"
            className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors duration-200 inline-block"
          >
            Don't have an account? <span className="font-bold underline">Sign Up</span>
          </RouterLink>
        </div>
      </div>

      <DownloadAppModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default LoginPage;