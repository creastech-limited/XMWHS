import React, { useState } from 'react';
import { Building2, MapPin, Phone, Briefcase } from 'lucide-react';
import { FormInput } from '../../components/shared/FormInput';
import { PasswordInput } from '../../components/shared/PasswordInput';
import { SelectInput } from '../../components/shared/SelectInput';
import { SubmitButton } from '../../components/shared/SubmitButton';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { SuccessAlert } from '../../components/shared/SuccessAlert';

interface CorporateFormData {
  businessName: string;
  businessType: string;
  businessDescription: string;
  companyAddress: string;
  phoneNumber: string;
  password: string;
}

type CorporateErrors = Partial<Record<keyof CorporateFormData, string>>;

const initialData: CorporateFormData = {
  businessName: '',
  businessType: '',
  businessDescription: '',
  companyAddress: '',
  phoneNumber: '',
  password: '',
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
  const [formData, setFormData] = useState<CorporateFormData>(initialData);
  const [errors, setErrors] = useState<CorporateErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as the user fixes it
    if (errors[name as keyof CorporateFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): CorporateErrors => {
    const next: CorporateErrors = {};

    if (!formData.businessName.trim()) next.businessName = 'Business name is required';
    if (!formData.businessType) next.businessType = 'Select a business type';
    if (!formData.companyAddress.trim()) next.companyAddress = 'Company address is required';

    if (!formData.phoneNumber.trim()) {
      next.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phoneNumber.trim())) {
      next.phoneNumber = 'Enter a valid phone number';
    }

    if (!formData.password) {
      next.password = 'Password is required';
    } else if (formData.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }

    // businessDescription is optional, so it is not validated
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      // TODO: replace with the corporate signup endpoint once it exists, e.g.
      // await api.post('/auth/corporate/signup', formData);
      console.log('Corporate signup payload:', formData);
      setSuccessMessage('Corporate form is ready. The signup endpoint is not connected yet.');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ErrorAlert message={errorMessage} />
      <SuccessAlert message={successMessage} />

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Business Description (optional) */}
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

        {/* Company Address */}
        <FormInput
          type="text"
          name="companyAddress"
          value={formData.companyAddress}
          onChange={handleChange}
          placeholder="Company Address"
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

        {/* Password */}
        <PasswordInput
          name="password"
          value={formData.password}
          onChange={(value) => {
            const event = {
              target: { name: 'password', value },
            } as React.ChangeEvent<HTMLInputElement>;
            handleChange(event);
          }}
          placeholder="Password"
          error={errors.password}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
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