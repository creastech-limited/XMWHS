import React from 'react';
import { User, Mail, BookOpen, Phone } from 'lucide-react';
import { SlideOver } from '../shared/SlideOver';
import { FormInput } from '../shared/FormInput';
import { PasswordInput } from '../shared/PasswordInput';
import { SelectInput } from '../shared/SelectInput';
import { ErrorAlert } from '../shared/ErrorAlert';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useStudentRegistration } from '../../hooks/useStudentRegistration';

interface AddStudentDrawerProps {
  open: boolean;
  onClose: () => void;
  /** The same registration link shown on the page; carries schoolId etc. */
  registrationLink: string;
  onSuccess: () => void;
}

const AddStudentForm: React.FC<{
  registrationLink: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ registrationLink, onClose, onSuccess }) => {
  const {
    formData,
    errors,
    schoolInfo,
    schoolLoading,
    showPassword,
    showConfirmPassword,
    isSubmitting,
    errorMessage,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
  } = useStudentRegistration({
    registrationLink,
    onSuccess,
    skipTerms: true,
  });

  const classOptions =
    schoolInfo?.classes.map((cls) => ({
      value: cls.className,
      label: cls.section ? `${cls.className} (${cls.section})` : cls.className,
    })) || [];

  const passwordChange =
    (name: 'password' | 'confirmPassword') => (value: string) =>
      handleChange({
        target: { name, value },
      } as React.ChangeEvent<HTMLInputElement>);

  const sectionTitle = 'mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400';

  return (
    <form id="add-student-form" onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6">
        <ErrorAlert message={errorMessage} />

        {schoolLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section>
              <h3 className={sectionTitle}>Student details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormInput
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    error={errors.firstName}
                    icon={<User size={18} />}
                  />
                  <FormInput
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    error={errors.lastName}
                    icon={<User size={18} />}
                  />
                </div>
                <FormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  error={errors.email}
                  icon={<Mail size={18} />}
                />
                <FormInput
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  error={errors.phone}
                  icon={<Phone size={18} />}
                />
                <SelectInput
                  name="classAdmittedTo"
                  value={formData.classAdmittedTo}
                  onChange={handleChange}
                  options={classOptions}
                  placeholder="Select class"
                  error={errors.classAdmittedTo}
                  icon={<BookOpen size={18} />}
                  disabled={!schoolInfo}
                />
              </div>
            </section>

            <section className="border-t border-slate-100 pt-6">
              <h3 className={sectionTitle}>Login</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={passwordChange('password')}
                  placeholder="Password"
                  error={errors.password}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                />
                <PasswordInput
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={passwordChange('confirmPassword')}
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
                  showPassword={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Pinned action bar */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || schoolLoading || !schoolInfo}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Adding...' : 'Add student'}
        </button>
      </div>
    </form>
  );
};

const AddStudentDrawer: React.FC<AddStudentDrawerProps> = ({
  open,
  onClose,
  registrationLink,
  onSuccess,
}) => (
  <SlideOver
    open={open}
    onClose={onClose}
    title="Add a student"
    subtitle="Create a new student record and assign them to a class."
  >
    <AddStudentForm
      registrationLink={registrationLink}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  </SlideOver>
);

export default AddStudentDrawer;