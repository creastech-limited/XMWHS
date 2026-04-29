import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, School, ShieldCheck, User, UserPlus } from 'lucide-react';
import bgImage from '../bg.jpeg';
import { getSchoolById, registerSecurity } from '../../services';
import type { RegistrationResponse, SchoolInfoResponse, SecurityRegistrationRequest } from '../../types/auth';

interface SchoolInfo {
  _id: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const SecurityRegistrationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const schoolId = searchParams.get('schoolId')?.trim() || '';
  const fallbackSchoolName = decodeURIComponent(searchParams.get('schoolName')?.trim() || '');
  const fallbackSchoolType = decodeURIComponent(searchParams.get('schoolType')?.trim() || '');
  const fallbackSchoolAddress = decodeURIComponent(searchParams.get('schoolAddress')?.trim() || '');

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+234',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (!schoolId) {
      setErrorMessage('Invalid security signup link. Missing school identification.');
      setLoadingSchool(false);
      return;
    }

    const loadSchool = async () => {
      try {
        setLoadingSchool(true);
        const response: SchoolInfoResponse = await getSchoolById(schoolId);

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Could not load school information');
        }

        setSchoolInfo({
          _id: response.data._id,
          schoolName: response.data.schoolName || fallbackSchoolName,
          schoolType: response.data.schoolType || fallbackSchoolType,
          schoolAddress: response.data.schoolAddress || fallbackSchoolAddress,
        });
      } catch (error) {
        console.error('Security school lookup failed', error);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load school information.');
      } finally {
        setLoadingSchool(false);
      }
    };

    loadSchool();
  }, [fallbackSchoolAddress, fallbackSchoolName, fallbackSchoolType, schoolId]);

  const passwordIsStrong = useMemo(() => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(formData.password);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!schoolId) {
      setErrorMessage('Invalid security signup link.');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!passwordIsStrong) {
      setErrorMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!formData.agreeToTerms) {
      setErrorMessage('You must agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData: SecurityRegistrationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: 'security',
        password: formData.password,
        schoolId,
        schoolName: schoolInfo?.schoolName || fallbackSchoolName,
        schoolType: schoolInfo?.schoolType || fallbackSchoolType,
        schoolAddress: schoolInfo?.schoolAddress || fallbackSchoolAddress,
      };

      const result: RegistrationResponse = await registerSecurity(registrationData);

      if (result.user || result.success || result.message === 'Registration successful') {
        setInfoMessage(result.message || 'Security account created successfully. Redirecting to login...');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '+234',
          password: '',
          confirmPassword: '',
          agreeToTerms: false,
        });

        window.setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(result.message || 'Security registration failed.');
      }
    } catch (error: unknown) {
      console.error('Security registration failed', error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Security registration failed. Please try again.');

      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loadingSchool && errorMessage && !schoolInfo) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/95 p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
          <h1 className="mb-3 text-2xl font-bold text-gray-900">Invalid Security Signup Link</h1>
          <p className="mb-6 text-sm text-gray-600">{errorMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white/95 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <UserPlus className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Registration</h1>

          {loadingSchool ? (
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="mt-4 space-y-1">
              <h2 className="text-xl font-semibold text-blue-600">{schoolInfo?.schoolName || fallbackSchoolName}</h2>
              <p className="capitalize text-gray-600">{schoolInfo?.schoolType || fallbackSchoolType} School</p>
              {!!(schoolInfo?.schoolAddress || fallbackSchoolAddress) && (
                <p className="text-sm text-gray-500">{schoolInfo?.schoolAddress || fallbackSchoolAddress}</p>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 text-black"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 text-black"
              />
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 text-black"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 text-black"
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <School className="h-4 w-4" />
              <span>Assigned School</span>
            </div>
            <div>{schoolInfo?.schoolName || fallbackSchoolName || 'School information pending'}</div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Role</span>
            </div>
            <div>Security</div>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 pr-12 text-black"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 pr-12 text-black"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <span>I agree to the terms and understand this registration is for school security access.</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creating Security Account...' : 'Create Security Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityRegistrationForm;
