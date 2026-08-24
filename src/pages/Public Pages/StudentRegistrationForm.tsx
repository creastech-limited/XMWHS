// src/pages/Public Pages/StudentRegistrationForm.tsx
import React from 'react';
import { 
  User, 
  Mail, 
  BookOpen,
  Phone
} from 'lucide-react';
import { useStudentRegistration } from '../../hooks/useStudentRegistration';
import { AuthLayout } from '../../components/shared/AuthLayout';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { Checkbox } from '../../components/shared/Checkbox';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';
import { SchoolInfo } from '../../components/shared/SchoolInfo';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { InvalidTokenPage } from '../../components/shared/InvalidTokenPage';
import logo from '../5.png';
import bgImage from '../bg.jpeg';

const StudentRegistrationForm: React.FC = () => {
  const {
    formData,
    errors,
    schoolInfo,
    schoolLoading,
    schoolNotFound,
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,
    successMessage,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    // Remove navigate from here since it's not used in this component
  } = useStudentRegistration();

  // Show invalid school page
  if (schoolNotFound) {
    return (
      <InvalidTokenPage
        errorMessage={errorMessage}
        logo={logo}
        bgImage={bgImage}
        linkTo="/"
        linkText="Return to Home"
        title="Invalid Registration Link"
        description="The registration link is invalid or expired. Please contact your school administrator for assistance."
      />
    );
  }

  // Get class options from school info
  const classOptions = schoolInfo?.classes.map(cls => ({
    value: cls.className,
    label: cls.section ? `${cls.className} (${cls.section})` : cls.className
  })) || [];

  return (
    <AuthLayout
      title="Student Registration"
      logo={logo}
      bgImage={bgImage}
    >
      {/* School Info */}
      {schoolLoading ? (
        <LoadingSpinner />
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
      <SuccessAlert message={successMessage} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            error={errors.firstName}
            icon={<User size={18} />}
          />
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

        {/* Phone */}
        <FormInput
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          error={errors.phone}
          icon={<Phone size={18} />}
        />

        {/* Class Selection */}
        <SelectInput
          name="classAdmittedTo"
          value={formData.classAdmittedTo}
          onChange={handleChange}
          options={classOptions}
          placeholder="Select Class"
          error={errors.classAdmittedTo}
          icon={<BookOpen size={18} />}
          disabled={schoolLoading || !schoolInfo}
        />

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            showPassword={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>

        {/* Terms Checkbox */}
        <Checkbox
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          error={errors.agreeToTerms}
          label="I agree to the Terms and Conditions"
        />

        {/* Submit Button - Remove disabled prop if not supported */}
        <SubmitButton
          isLoading={isSubmitting}
          loadingText="Registering..."
          defaultText="Register"
        />
      </form>
    </AuthLayout>
  );
};

export default StudentRegistrationForm;