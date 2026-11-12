// src/pages/Public Pages/SecurityRegistrationForm.tsx
import React from 'react';
import {
  User,
  Mail,
  Phone,
  School,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useSecurityRegistration } from '../../hooks/useSecurityRegistration';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { Checkbox } from '../../components/shared/Checkbox';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';
import { SchoolInfo } from '../../components/shared/SchoolInfo';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { RoleInfo } from '../../components/shared/RoleInfo';
import { InvalidTokenPage } from '../../components/shared/InvalidTokenPage';
import logo from '../5.png';
import bgImage from '../bg.jpeg';
import { Link } from 'react-router-dom';

const SecurityRegistrationForm: React.FC = () => {
  const {
    formData,
    schoolInfo,
    loadingSchool,
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,
    infoMessage,
    fallbackSchoolName,
    // Remove unused: fallbackSchoolType, fallbackSchoolAddress, navigate
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
  } = useSecurityRegistration();

  // Show invalid school page
  if (!loadingSchool && errorMessage && !schoolInfo) {
    return (
      <InvalidTokenPage
        errorMessage={errorMessage}
        logo={logo}
        bgImage={bgImage}
        linkTo="/login"
        linkText="Back to Login"
        title="Invalid Security Signup Link"
        description="This security signup link is invalid or expired. Please contact your school administrator."
      />
    );
  }

  return (
    <AuthLayout
      title="Security Registration"
      logo={logo}
      bgImage={bgImage}
    >
      {/* School Info */}
      {loadingSchool ? (
        <LoadingSpinner className="mb-6" />
      ) : schoolInfo && (
        <SchoolInfo
          schoolName={schoolInfo.schoolName}
          schoolType={schoolInfo.schoolType}
          schoolAddress={schoolInfo.schoolAddress}
          className="mb-6"
        />
      )}

      {/* Alerts */}
      <ErrorAlert message={errorMessage} />
      <SuccessAlert message={infoMessage} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            icon={<User size={18} />}
            placeholder="First Name"
          />
          <FormInput
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            icon={<User size={18} />}
            placeholder="Last Name"
          />
        </div>

        {/* Email */}
        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          icon={<Mail size={18} />}
          placeholder="Email Address"
        />

        {/* Phone */}
        <FormInput
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          icon={<Phone size={18} />}
          placeholder="Phone Number"
        />

        {/* Assigned School */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <School className="h-4 w-4" />
            <span>Assigned School</span>
          </div>
          <div>{schoolInfo?.schoolName || fallbackSchoolName || 'School information pending'}</div>
        </div>

        {/* Role */}
        <RoleInfo role="Security" icon={<ShieldCheck className="h-4 w-4" />} />

        {/* Password */}
        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={(value) => {
            const event = {
              target: { name: 'password', value }
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(event);
          }}
          placeholder="Password"
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          required
          helperText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(value) => {
            const event = {
              target: { name: 'confirmPassword', value }
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(event);
          }}
          placeholder="Confirm Password"
          showPassword={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          required
        />

        {/* Terms Checkbox */}
        <Checkbox
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          label="I agree to the terms and understand this registration is for school security access."
        />

        {/* Submit Button */}
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Creating Security Account..."
          defaultText="Create Security Account"
        />
        <div className="w-full bg-gray-200 py-3 px-4 text-center hover:bg-gray-300 rounded-lg transition transform hover:-translate-y-1">
          <Link
            to="/attendance/security"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SecurityRegistrationForm;