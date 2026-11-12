// src/components/store/AgentDrawer.tsx
// Replaces AgentForm. Same props, so useManageAgents needs no changes.
import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import type { AgentFormData, AgentFormErrors } from '../../types/agent';

interface AgentDrawerProps {
  isOpen: boolean;
  storeName: string;
  formData: AgentFormData;
  errors: AgentFormErrors;
  isLoading: boolean;
  showPassword: boolean;
  onClose: () => void;
  onChange: (field: keyof AgentFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTogglePassword: () => void;
}

const strength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return pw ? Math.max(s, 1) : 0;
};
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-600'];

const inputBase =
  'w-full rounded-lg border bg-white py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Field: React.FC<{
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  type?: string;
  value: string;
  placeholder: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, error, hint, icon, trailing, inputRef, type = 'text', value, placeholder, autoComplete, onChange }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={`${inputBase} ${icon ? 'pl-9' : 'pl-3'} ${trailing ? 'pr-10' : 'pr-3'} ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        {trailing && <span className="absolute inset-y-0 right-0 flex items-center pr-3">{trailing}</span>}
      </div>
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

const AgentDrawer: React.FC<AgentDrawerProps> = ({
  isOpen,
  storeName,
  formData,
  errors,
  isLoading,
  showPassword,
  onClose,
  onChange,
  onSubmit,
  onTogglePassword,
}) => {
  const [shown, setShown] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const loadingRef = useRef(isLoading);
  loadingRef.current = isLoading;

  // slide-in
  useEffect(() => {
    if (!isOpen) return setShown(false);
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [isOpen]);

  // focus first field once per open
  useEffect(() => {
    if (isOpen) firstRef.current?.focus();
  }, [isOpen]);

  // Escape to close + lock page scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const score = strength(formData.password);

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 motion-reduce:transition-none ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <header className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 id="agent-drawer-title" className="text-base font-semibold text-slate-900">
                Add a new agent
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Create an account for someone who will collect payments for your store.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close"
              className="rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="First name"
                placeholder="e.g. Grace"
                value={formData.firstName}
                onChange={onChange('firstName')}
                error={errors.firstName}
                inputRef={firstRef}
                autoComplete="off"
              />
              <Field
                label="Last name"
                placeholder="e.g. Okafor"
                value={formData.lastName}
                onChange={onChange('lastName')}
                error={errors.lastName}
                autoComplete="off"
              />
            </div>
            <Field
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder="grace.okafor@gmail.com"
              hint="The agent signs in with this email."
              value={formData.email}
              onChange={onChange('email')}
              error={errors.email}
              autoComplete="off"
            />
            <Field
              label="Phone number"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
              placeholder="0803 000 0000"
              value={formData.phone}
              onChange={onChange('phone')}
              error={errors.phone}
              autoComplete="off"
            />

            <div className="border-t border-slate-100 pt-5">
              <Field
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="h-4 w-4" />}
                placeholder="At least 6 characters"
                hint="Share this with the agent so they can sign in."
                value={formData.password}
                onChange={onChange('password')}
                error={errors.password}
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              {score > 0 && (
                <div className="mt-2 flex items-center gap-3" aria-live="polite">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= score ? STRENGTH_COLOR[score] : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="w-12 text-right text-xs text-slate-500">{STRENGTH_LABEL[score]}</span>
                </div>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-slate-500">Saved to {storeName} only.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? 'Creating agent…' : 'Create agent'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
};

export default AgentDrawer;