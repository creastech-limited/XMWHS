import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { User, Mail, School } from 'lucide-react';
import { useSignUp } from '../../hooks/useSignUp';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { Checkbox } from '../../components/shared/Checkbox';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';
import logo from '/xpay.jpeg';
import bgImage from '../bg.jpeg';

const SignUpPage: React.FC = () => {
  const {
    formData,
    errors,
    showPassword,
    errorMessage,
    successMessage,
    isLoading,
    setShowPassword,
    handleChange,
    handleSubmit
  } = useSignUp();

  const roleOptions = [
    { value: 'parent', label: 'Parent' },
    // Add more roles as needed
  ];

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join our community today"
      linkText="Already have an account?"
      linkTo="/login"
      linkLabel="Sign In"
      logo={logo}
      bgImage={bgImage}
    >
      {/* Alerts */}
      <ErrorAlert message={errorMessage} />
      <SuccessAlert message={successMessage} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <FormInput
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              error={errors.firstName}
              icon={<User size={18} />}
            />
          </div>
          <div className="w-1/2">
            <FormInput
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              error={errors.lastName}
              icon={<User size={18} />}
            />
          </div>
        </div>

        {/* Email */}
        <FormInput
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          error={errors.email}
          icon={<Mail size={18} />}
        />

        {/* Role Selection - Disabled as per original */}
        <SelectInput
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={roleOptions}
          error={errors.role}
          icon={<School size={18} />}
          disabled={true}
        />

        {/* Password */}
        <PasswordInput
          name="password"
          value={formData.password}
          onChange={(value) => {
            const event = {
              target: { name: 'password', value }
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(event);
          }}
          placeholder="Password"
          error={errors.password}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        {/* Confirm Password */}
        <PasswordInput
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(value) => {
            const event = {
              target: { name: 'confirmPassword', value }
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(event);
          }}
          placeholder="Confirm Password"
          error={errors.confirmPassword}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        {/* Terms Checkbox */}
        <Checkbox
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          error={errors.termsAccepted}
          label={
            <>
              I confirm that I have read and agree to the{' '}
              <RouterLink to="/privacyAndPolicy" className="text-indigo-700 underline hover:text-indigo-900">
                Privacy and Policy
              </RouterLink>
            </>
          }
        />

        {/* Submit Button */}
        <SubmitButton
          isLoading={isLoading}
          loadingText="Creating Account..."
          defaultText="Create Account"
        />
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;