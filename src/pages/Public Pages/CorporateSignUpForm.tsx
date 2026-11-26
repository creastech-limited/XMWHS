import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Briefcase, Mail, User } from 'lucide-react';
import { registerStore } from '../../services';
import { validateEmail, validatePassword, isAxiosError } from '../../utils/validators';
import type { StoreRegistrationRequest } from '../../types/auth';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { Checkbox } from '../../components/shared/Checkbox';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';

interface CorporateFormData {
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  companyAddress: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

type CorporateErrors = Partial<Record<keyof CorporateFormData, string>>;

const initialData: CorporateFormData = {
  firstName: '',
  lastName: '',
  businessName: '',
  businessType: '',
  companyAddress: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
};

const businessTypeOptions = [
  { value: '', label: 'Select business type' },
  { value: 'school', label: 'School / Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

const CorporateSignUpForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CorporateFormData>(initialData);
  const [errors, setErrors] = useState<CorporateErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear the field's error as the user fixes it
    if (errors[name as keyof CorporateFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): CorporateErrors => {
    const next: CorporateErrors = {};

    if (!formData.firstName.trim()) next.firstName = 'First name is required';
    if (!formData.lastName.trim()) next.lastName = 'Last name is required';
    if (!formData.businessName.trim()) next.businessName = 'Business name is required';
    if (!formData.businessType) next.businessType = 'Select a business type';
    if (!formData.companyAddress.trim()) next.companyAddress = 'Company address is required';

    if (!formData.phoneNumber.trim()) {
      next.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phoneNumber.trim())) {
      next.phoneNumber = 'Enter a valid phone number';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) next.email = emailError;

    if (!formData.password) {
      next.password = 'Password is required';
    } else if (formData.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    if (!formData.termsAccepted) {
      next.termsAccepted = 'You must accept the privacy and policy to proceed';
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!validatePassword(formData.password)) {
      setErrorMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload: StoreRegistrationRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        storeName: formData.businessName.trim(),
        storeType: formData.businessType,
        phone: formData.phoneNumber.trim(),
        location: formData.companyAddress.trim(),
        isStandAlone: true,
        termsAccepted: formData.termsAccepted,
      };

      const result = await registerStore(payload);

      if (result.user || result.message === 'Registration successful') {
        setSuccessMessage(result.message || 'Account created successfully!');
        setFormData(initialData);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setErrorMessage(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Corporate registration error:', error);

      let userMessage = 'Something went wrong. Please try again.';
      if (isAxiosError(error) && error.response?.data?.message) {
        userMessage = error.response.data.message;
      } else if (error instanceof Error) {
        userMessage = error.message;
      }
      setErrorMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ErrorAlert message={errorMessage} />
      <SuccessAlert message={successMessage} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact person */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <FormInput
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Contact First Name"
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
              placeholder="Contact Last Name"
              error={errors.lastName}
              icon={<User size={18} />}
            />
          </div>
        </div>

        {/* Business Name */}
        <FormInput
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="Business Name"
          error={errors.businessName}
          icon={<Building2 size={18} />}
        />

        {/* Business Type */}
        <SelectInput
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          options={businessTypeOptions}
          error={errors.businessType}
          icon={<Briefcase size={18} />}
        />

        {/* Business Description removed for now
                <div>
          <textarea
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleChange}
            placeholder="Business Description (optional)"
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        */}

        {/* Company Address */}
        <FormInput
          type="text"
          name="companyAddress"
          value={formData.companyAddress}
          onChange={handleChange}
          placeholder="Business Address"
          error={errors.companyAddress}
          icon={<MapPin size={18} />}
        />

        {/* Phone Number */}
        <FormInput
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Phone Number"
          error={errors.phoneNumber}
          icon={<Phone size={18} />}
        />

        {/* Email */}
        <FormInput
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Business Email Address"
          error={errors.email}
          icon={<Mail size={18} />}
        />

        {/* Password */}
        <PasswordInput
          name="password"
          value={formData.password}
          onChange={(value) =>
            handleChange({
              target: { name: 'password', value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          placeholder="Password"
          error={errors.password}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        {/* Confirm Password */}
        <PasswordInput
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(value) =>
            handleChange({
              target: { name: 'confirmPassword', value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          placeholder="Confirm Password"
          error={errors.confirmPassword}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        {/* Terms */}
        <Checkbox
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          error={errors.termsAccepted}
          label={
            <>
              I confirm that I have read and agree to the{' '}
              <Link
                to="/privacyAndPolicy"
                className="text-indigo-700 underline hover:text-indigo-900"
              >
                Privacy and Policy
              </Link>
            </>
          }
        />

        <SubmitButton
          isLoading={isLoading}
          loadingText="Creating Account..."
          defaultText="Create Corporate Account"
        />
      </form>
    </>
  );
};

export default CorporateSignUpForm;