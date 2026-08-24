import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  BuildingLibraryIcon, 
  MapPinIcon, 
  PhoneIcon,  
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useSchoolRegistration } from '../../hooks/useSchoolRegistration';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { Checkbox } from '../../components/shared/Checkbox';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';
import logo from '../5.png';
import bgImage from '../bg.jpeg';

// Icon wrapper to convert Heroicons to React.ReactNode
const IconWrapper = ({ Icon }: { Icon: React.ComponentType<{ className?: string }> }) => (
  <Icon className="h-5 w-5" />
);

const SchoolSignupPage: React.FC = () => {
  const {
    formData,
    errors,
    showPassword,
    errorMessage,
    successMessage,
    isLoading,
    schoolTypeOptions,
    setShowPassword,
    handleChange,
    handleSubmit,
  } = useSchoolRegistration();

  const roleOptions = [
    { value: 'school', label: 'School' }
  ];

  return (
    <AuthLayout
      title="School Registration"
      subtitle="Register your school today"
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
              label="First Name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              icon={<IconWrapper Icon={UserIcon} />}
              placeholder="First Name"
              error={errors.firstName}
            />
          </div>
          <div className="w-1/2">
            <FormInput
              label="Last Name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              icon={<IconWrapper Icon={UserIcon} />}
              placeholder="Last Name"
              error={errors.lastName}
            />
          </div>
        </div>

        {/* Email */}
        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          icon={<IconWrapper Icon={EnvelopeIcon} />}
          placeholder="Email Address"
          error={errors.email}
        />

        {/* Role - Disabled as per original */}
        <SelectInput
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          options={roleOptions}
          required
          icon={<IconWrapper Icon={UserGroupIcon} />}
          disabled={true}
          error={errors.role}
        />

        {/* School Type */}
        <SelectInput
          label="School Type"
          name="schoolType"
          value={formData.schoolType}
          onChange={handleChange}
          options={schoolTypeOptions}
          required
          icon={<IconWrapper Icon={AcademicCapIcon} />}
          error={errors.schoolType}
        />

        {/* School Name */}
        <FormInput
          label="School Name"
          type="text"
          name="schoolName"
          value={formData.schoolName}
          onChange={handleChange}
          required
          icon={<IconWrapper Icon={BuildingLibraryIcon} />}
          placeholder="School Name"
          error={errors.schoolName}
        />

        {/* School Address */}
        <FormInput
          label="School Address"
          type="text"
          name="schoolAddress"
          value={formData.schoolAddress}
          onChange={handleChange}
          required
          icon={<IconWrapper Icon={MapPinIcon} />}
          placeholder="School Address"
          error={errors.schoolAddress}
        />

        {/* Phone */}
        <FormInput
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          icon={<IconWrapper Icon={PhoneIcon} />}
          placeholder="Phone Number"
          error={errors.phone}
        />

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
          error={errors.password}
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
          error={errors.confirmPassword}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          required
          helperText={formData.password !== formData.confirmPassword && formData.confirmPassword ? "Passwords don't match" : 'Re-enter your password to confirm'}
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
              <Link to="/terms" className="text-indigo-700 underline hover:text-indigo-900">
                Terms and Conditions
              </Link>
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

      {/* Footer Link */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Register as a{' '}
          <Link to="/signup" className="text-indigo-700 font-medium hover:underline">
            Parent
          </Link>
          {' '} instead
        </p>
      </div>
    </AuthLayout>
  );
};

export default SchoolSignupPage;