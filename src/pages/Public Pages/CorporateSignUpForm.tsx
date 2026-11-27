import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Briefcase, Mail, User, GraduationCap } from 'lucide-react';
import { registerStore, registerSchool } from '../../services';
import { validateEmail, validatePassword, isAxiosError } from '../../utils/validators';
import type {
  StoreRegistrationRequest,
  SchoolRegistrationRequest,
  SchoolType,
} from '../../types/auth';
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
  schoolType: string;
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
  schoolType: '',
  companyAddress: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
};

const SCHOOL_BUSINESS_TYPE = 'school';

const businessTypeOptions = [
  { value: '', label: 'Select business type' },
  { value: SCHOOL_BUSINESS_TYPE, label: 'School / Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' },
];

const schoolTypeOptions = [
  { value: '', label: 'Select school type' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'primary and secondary', label: 'Primary and Secondary' },
  { value: 'university', label: 'University' },
  { value: 'polytechnic', label: 'Polytechnic' },
];

const CorporateSignUpForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CorporateFormData>(initialData);
  const [errors, setErrors] = useState<CorporateErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSchool = formData.businessType === SCHOOL_BUSINESS_TYPE;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Leaving "school" clears the school type so a stale value is never sent
      if (name === 'businessType' && value !== SCHOOL_BUSINESS_TYPE) {
        next.schoolType = '';
      }
      return next;
    });

    // Clear the field's error as the user fixes it
    if (errors[name as keyof CorporateFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): CorporateErrors => {
    const next: CorporateErrors = {};

    if (!formData.firstName.trim()) next.firstName = 'First name is required';
    if (!formData.lastName.trim()) next.lastName = 'Last name is required';
    if (!formData.businessName.trim()) {
      next.businessName = isSchool ? 'School name is required' : 'Business name is required';
    }
    if (!formData.businessType) next.businessType = 'Select a business type';
    if (isSchool && !formData.schoolType) next.schoolType = 'Select a school type';
    if (!formData.companyAddress.trim()) next.companyAddress = 'Address is required';

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

  const handleTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, termsAccepted: event.target.checked });
    if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: '' });
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
      let result;

      if (isSchool) {
        // School -> role "school"
        const schoolPayload: SchoolRegistrationRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'school',
          schoolName: formData.businessName.trim(),
          schoolAddress: formData.companyAddress.trim(),
          phone: formData.phoneNumber.trim(),
          schoolType: formData.schoolType as SchoolType,
        };
        result = await registerSchool(schoolPayload);
      } else {
        // Everything else -> role "store" (added inside registerStore)
        const storePayload: StoreRegistrationRequest = {
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
        result = await registerStore(storePayload);
      }

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

        {/* Business Type (decides the role: school -> school, anything else -> store) */}
        <SelectInput
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          options={businessTypeOptions}
          error={errors.businessType}
          icon={<Briefcase size={18} />}
        />

        {/* School Type (only when School / Education is chosen) */}
        {isSchool && (
          <SelectInput
            name="schoolType"
            value={formData.schoolType}
            onChange={handleChange}
            options={schoolTypeOptions}
            error={errors.schoolType}
            icon={<GraduationCap size={18} />}
          />
        )}

        {/* Business / School Name */}
        <FormInput
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder={isSchool ? 'School Name' : 'Business Name'}
          error={errors.businessName}
          icon={<Building2 size={18} />}
        />

        {/* Address */}
        <FormInput
          type="text"
          name="companyAddress"
          value={formData.companyAddress}
          onChange={handleChange}
          placeholder={isSchool ? 'School Address' : 'Business Address'}
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
          placeholder={isSchool ? 'School Email Address' : 'Business Email Address'}
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
          onChange={handleTermsChange}
          error={errors.termsAccepted}
          label={
            <>
              I confirm that I have read and agree to the{' '}
              <Link to="/privacyAndPolicy" className="text-indigo-700 underline hover:text-indigo-900">
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