import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import { FormInput } from '../../components/shared/FormInput';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';
import logo from '../5.png';
import bgImage from '../bg.jpeg';

const ForgotPasswordPage: React.FC = () => {
  const {
    email,
    isLoading,
    message,
    errorMessage,
    formError,
    handleChange,
    handleSubmit
  } = useForgotPassword();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />

      <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Alerts */}
        <ErrorAlert message={errorMessage} />
        <SuccessAlert message={message} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="Email address"
            error={formError}
            icon={<Mail size={18} />}
            className={isLoading ? 'opacity-70' : ''}
          />

          <SubmitButton
            isLoading={isLoading}
            loadingText="Sending..."
            defaultText="Send Reset Link"
          />
        </form>

        {/* Back to Login */}
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