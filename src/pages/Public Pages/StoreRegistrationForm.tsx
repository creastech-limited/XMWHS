// src/pages/Public Pages/StoreRegistrationForm.tsx
import React from 'react';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building
} from 'lucide-react';
import { useStoreRegistration } from '../../hooks/useStoreRegistration';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { Textarea } from '../../components/shared/Textarea';
import { Stepper } from '../../components/shared/Stepper';
import { FormNavigation } from '../../components/shared/FormNavigation';
import { Snackbar } from '../../components/shared/Snackbar';
import bgImage from '../bg.jpeg';

const StoreRegistrationForm: React.FC = () => {
  const {
    formData,
    errors,
    activeStep,
    isSubmitting,
    snackbar,
    showPassword,
    locations,
    storeTypes,
    steps,
    displaySchool,
    
    setShowPassword,
    handleChange,
    handleNext,
    handleBack,
    closeSnackbar,
  } = useStoreRegistration();

  // Check if current step is valid
  const isStepValid = (): boolean => {
    switch (activeStep) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.storeName && formData.storeType && formData.description);
      case 1:
        return !!(formData.email && formData.phone && formData.location);
      case 2:
        return !!(formData.password && formData.confirmPassword);
      default:
        return false;
    }
  };

  // Get step content
  const getStepContent = (step: number): React.ReactNode => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                required
                icon={<User size={20} />}
                placeholder="Enter your first name"
                error={errors.firstName}
              />
              <FormInput
                label="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
                icon={<User size={20} />}
                placeholder="Enter your last name"
                error={errors.lastName}
              />
            </div>
            <FormInput
              label="Store Name"
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange('storeName')}
              required
              icon={<Store size={20} />}
              placeholder="Enter your store name"
              error={errors.storeName}
            />
            <SelectInput
              label="Store Type"
              name="storeType"
              value={formData.storeType}
              onChange={handleChange('storeType')}
              options={storeTypes.map(type => ({ value: type, label: type }))}
              required
              icon={<Building size={20} />}
              error={errors.storeType}
            />
            <Textarea
              label="Store Description"
              name="description"
              value={formData.description}
              onChange={handleChange('description')}
              required
              placeholder="Describe your store and what products/services you offer..."
              error={errors.description}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              icon={<Mail size={20} />}
              placeholder="Enter your email address"
              error={errors.email}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              required
              icon={<Phone size={20} />}
              placeholder="Enter your phone number"
              error={errors.phone}
            />
            <SelectInput
              label="Store Location"
              name="location"
              value={formData.location}
              onChange={handleChange('location')}
              options={locations.map(loc => ({ value: loc, label: loc }))}
              required
              icon={<MapPin size={20} />}
              error={errors.location}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={(value) => {
                const event = {
                  target: { name: 'password', value }
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange('password')(event);
              }}
              placeholder="Create a secure password"
              error={errors.password}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              helperText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
              required
            />
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(value) => {
                const event = {
                  target: { name: 'confirmPassword', value }
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange('confirmPassword')(event);
              }}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              helperText={formData.password !== formData.confirmPassword && formData.confirmPassword ? "Passwords don't match" : 'Re-enter your password to confirm'}
              required
            />
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  const stepConfig = steps.map(label => ({ label }));

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-fixed bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage})`
      }}
    >
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Store Registration</h1>
           {displaySchool && (
  <p className="text-gray-600 text-lg">
    Registering new store for <span className="font-semibold text-indigo-600">{displaySchool}</span>
  </p>
)}
          </div>

          {/* Stepper */}
          <Stepper
            steps={stepConfig}
            activeStep={activeStep}
          />

          {/* Form Content */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            {getStepContent(activeStep)}
          </div>

          {/* Navigation */}
          <FormNavigation
            activeStep={activeStep}
            totalSteps={steps.length}
            isSubmitting={isSubmitting}
            isValid={isStepValid()}
            onBack={handleBack}
            onNext={handleNext}
            nextLabel="Next"
            backLabel="Back"
            submitLabel="Complete Registration"
          />
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        position="top-right"
      />
    </div>
  );
};

export default StoreRegistrationForm;