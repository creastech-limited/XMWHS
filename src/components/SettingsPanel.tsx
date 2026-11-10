import { useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  Bell,
  Camera,
  ShieldCheck,
  KeyRound,
  Mail,
  Smartphone,
  DollarSign,
  Megaphone,
  Check,
  Eye,
  EyeOff,
  Palette,
  Sparkles,
  RotateCcw,
  CalendarDays,
  CalendarCheck,
  GraduationCap,
  BellRing,
  Info,
} from 'lucide-react';
import { useSchoolTheme, SCHOOL_COLOR_PRESETS, PRIMARY_PALETTE, SECONDARY_PALETTE } from '../context/SchoolThemeContext';
import {
  getUserDetails,
  requestPinReset,
  setAccountPin,
  updateAccountPin,
  updateNotificationPreferences,
  updateUserPassword,
  updateUserProfile,
  uploadProfileImage,
  verifyPinOtp,
} from '../services';
import type { UpdateUserPayload } from '../types';

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                          */
/* -------------------------------------------------------------------------- */

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture: string;
  createdAt?: string;
  isPinSet?: boolean;
  role?: string;
  wallet?: {
    balance: number;
    currency: string;
    walletId: string;
  };
}

const TABS = [
  { label: 'Profile', icon: <User className="w-4 h-4" /> },
  { label: 'Security', icon: <Lock className="w-4 h-4" /> },
  { label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { label: 'Brand & Store', icon: <Palette className="w-4 h-4" /> },
  { label: 'Academic Calendar', icon: <CalendarDays className="w-4 h-4" /> },
];

// Shared style tokens (navy primary, soft slate neutrals)
const inputCls =
  'w-full h-11 px-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#0b1230]/15 focus:border-[#0b1230] ' +
  'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';
const labelCls = 'block text-xs font-semibold text-slate-900 mb-1.5';
const hintCls = 'text-xs text-slate-500 mt-1.5';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-[#0b1230] rounded-lg ' +
  'hover:bg-[#1a2352] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0b1230] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0b1230] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const chipCls =
  'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-slate-100 text-xs text-slate-500';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

const formatRole = (role?: string) =>
  role
    ? role
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* -------------------------------------------------------------------------- */
/*  Small presentational components (defined outside to avoid remounting)      */
/* -------------------------------------------------------------------------- */

interface SectionCardProps {
  title: string;
  description?: string;
  footer?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  children: ReactNode;
}

const SectionCard = ({ title, description, footer, onSubmit, children }: SectionCardProps) => {
  const inner = (
    <>
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 sm:px-6 py-6 space-y-6">{children}</div>
      {footer && (
        <div className="px-5 sm:px-6 py-3.5 bg-[#eef1f8] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          {footer}
        </div>
      )}
    </>
  );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {onSubmit ? <form onSubmit={onSubmit}>{inner}</form> : inner}
    </section>
  );
};

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}

const Toggle = ({ id, checked, onChange, label }: ToggleProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: 44,
        height: 26,
        padding: 0,
        borderRadius: 9999,
        border: 'none',
        backgroundColor: checked ? '#0b1230' : '#cbd5e1',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: focused ? '0 0 0 2px #fff, 0 0 0 4px #0b1230' : 'none',
        transition: 'background-color 200ms ease-in-out, box-shadow 150ms',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          transform: `translateX(${checked ? 18 : 0}px)`,
          transition: 'transform 200ms ease-in-out',
        }}
      />
    </button>
  );
};

interface SecretInputProps {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  numeric?: boolean;
  disabled?: boolean;
  required?: boolean;
}

interface SettingsPanelProps {
  showAcademicCalendar?: boolean;
}

/** Password / PIN input with a show-hide button. When `numeric`, only 4 digits are allowed. */
const SecretInput = ({ value, onChange, show, onToggle, placeholder, numeric, disabled, required }: SecretInputProps) => (
  <div className="relative">
    <input
      type={show ? 'text' : 'password'}
      inputMode={numeric ? 'numeric' : undefined}
      value={value}
      onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)}
      className={`${inputCls} pr-11`}
      placeholder={placeholder}
      maxLength={numeric ? 4 : undefined}
      disabled={disabled}
      required={required}
    />
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide' : 'Show'}
      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700"
    >
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

const SettingsPanel = ( { showAcademicCalendar = true }: SettingsPanelProps) => {
  const authContext = useAuth();
  const token = authContext?.token;
  const {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    applyPreset,
    saveColors,
    resetColors,
    isCustomized,
  } = useSchoolTheme();

  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageActions, setShowImageActions] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'pin' | 'otp'>('pin');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [showPin, setShowPin] = useState({ current: false, new: false, confirm: false, modal: false });
  const [otpValue, setOtpValue] = useState('');

  const visibleTabs = TABS.filter(
    (tab) => showAcademicCalendar || tab.label !== 'Academic Calendar',
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: '',
    createdAt: '',
  });

  const [academicDates, setAcademicDates] = useState({
    vacationDate: '',
    resumptionDate: '',
    promotionDate: '',
  });
  const [academicToggles, setAcademicToggles] = useState({
    notifyParents: false,
    autoPromote: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pinData, setPinData] = useState({ currentPin: '', pin: '', newPin: '' });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transactions: true,
    marketing: false,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  type NotificationKey = 'email' | 'push' | 'transactions' | 'marketing';

  const notificationOptions: {
    key: NotificationKey;
    id: string;
    Icon: React.ElementType;
    title: string;
    desc: string;
  }[] = [
      { key: 'email', id: 'emailNotifications', Icon: Mail, title: 'Email notifications', desc: 'Receive notifications via email' },
      { key: 'push', id: 'pushNotifications', Icon: Smartphone, title: 'SMS notifications', desc: 'Receive notifications on your device' },
      { key: 'transactions', id: 'transactionNotifications', Icon: DollarSign, title: 'Transaction notifications', desc: 'Get notified about transactions and activity' },
      { key: 'marketing', id: 'marketingNotifications', Icon: Megaphone, title: 'Marketing notifications', desc: 'Receive updates, news and special offers' },
    ];

  /* ----------------------------- Data fetching ----------------------------- */

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const response = await getUserDetails();

        if (response.user?.data) {
          const userData = response.user.data;
          const walletData = response.user.wallet;

          const fullProfilePictureUrl = userData.profilePicture
            ? `${API_BASE_URL}${userData.profilePicture}`
            : userData.profilePic
              ? `${API_BASE_URL}${userData.profilePic}`
              : '';

          const displayName =
            (userData.name || `${userData.firstName ?? ''} ${userData.lastName ?? ''}`).trim() || 'User';

          setUser({
            ...userData,
            name: displayName,
            profilePicture: fullProfilePictureUrl,
            isPinSet: !!userData.isPinSet,
            wallet: walletData
              ? {
                balance: walletData.balance,
                currency: walletData.currency ?? 'NGN',
                walletId: walletData.walletId ?? '',
              }
              : undefined,
            phone: typeof userData.phone === 'string' ? userData.phone : '',
          });

          setProfile({
            name: displayName,
            email: userData.email,
            phone: typeof userData.phone === 'string' ? userData.phone : '',
            profilePicture: fullProfilePictureUrl,
            createdAt: String(userData.createdAt || userData.registrationDate || ''),
          });

          setSelectedImage(null);
          setImagePreview(null);
          setShowImageActions(false);
          setAvatarError(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, API_BASE_URL]);

  /* -------------------------------- Handlers -------------------------------- */

  const profileDirty = !!user && (profile.name !== user.name || profile.phone !== user.phone);

  const handleProfileCancel = () => {
    if (!user) return;
    setProfile((prev) => ({ ...prev, name: user.name, phone: user.phone }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !token) return;

    setIsLoading(true);
    try {
      const payload: UpdateUserPayload = {
        name: profile.name,
        email: profile.email,
        phone: typeof profile.phone === 'string' ? profile.phone : '',
      };

      const updatedData = await updateUserProfile(user._id, payload);

      if (updatedData) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: typeof updatedData.name === 'string' ? updatedData.name : prev.name,
            email: typeof updatedData.email === 'string' ? updatedData.email : prev.email,
            phone: typeof updatedData.phone === 'string' ? updatedData.phone : prev.phone,
            profilePicture:
              typeof updatedData.profilePicture === 'string' ? updatedData.profilePicture : prev.profilePicture,
            wallet: updatedData.wallet
              ? {
                balance: updatedData.wallet.balance,
                currency: updatedData.wallet.currency ?? prev.wallet?.currency ?? 'NGN',
                walletId: updatedData.wallet.walletId ?? prev.wallet?.walletId ?? '',
              }
              : prev.wallet,
          };
        });
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Password update failed:', error);
      alert('Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pinData.pin !== pinData.newPin) {
      alert('PINs do not match. Please ensure both PIN fields are identical.');
      return;
    }

    if (pinData.pin.length !== 4 || !/^\d{4}$/.test(pinData.pin)) {
      alert('PIN must be exactly 4 digits (0-9).');
      return;
    }

    setIsLoading(true);

    try {
      if (user?.isPinSet) {
        if (!pinData.currentPin || pinData.currentPin.length !== 4 || !/^\d{4}$/.test(pinData.currentPin)) {
          alert('Please enter your current 4-digit PIN.');
          setIsLoading(false);
          return;
        }

        await updateAccountPin({ currentPin: pinData.currentPin, newPin: pinData.newPin });
        alert('PIN updated successfully! Your new PIN is now active.');
      } else {
        await setAccountPin({ pin: pinData.pin });
        alert('PIN set successfully! Your account is now more secure.');
        setUser((prev) => (prev ? { ...prev, isPinSet: true } : null));
      }

      setPinData({ currentPin: '', pin: '', newPin: '' });
    } catch (error) {
      console.error('PIN operation failed:', error);

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401) {
        alert('Current PIN is incorrect. Please try again.');
      } else if (status === 400) {
        alert('Invalid PIN format. Please ensure your PIN is 4 digits.');
      } else {
        alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResetModal = () => {
    setPinData({ currentPin: '', pin: '', newPin: '' });
    setResetStep('pin');
    setIsModalOpen(true);
  };

  const handleRequestOtp = async () => {
    if (pinData.pin.length < 4) {
      setSnackbar({ open: true, message: 'Please enter a 4-digit PIN', severity: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await requestPinReset(pinData.pin);
      setResetStep('otp');
      setSnackbar({ open: true, message: 'OTP sent to your email!', severity: 'success' });
    } catch (error: unknown) {
      let msg = 'Failed to send OTP';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.error || error.response?.data?.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpValue.length < 6) {
      setSnackbar({ open: true, message: 'Please enter the 6-digit OTP', severity: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await verifyPinOtp(otpValue, pinData.pin);

      setSnackbar({ open: true, message: 'PIN reset successfully!', severity: 'success' });
      setIsModalOpen(false);
      setResetStep('pin');
      setPinData({ ...pinData, pin: '' });
      setOtpValue('');
      setUser((prev) => (prev ? { ...prev, isPinSet: true } : null));
    } catch (error: unknown) {
      let msg = 'Verification failed';
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.error || error.response?.data?.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!selectedImage || !token) return;

    setUploadingImage(true);
    try {
      const data = await uploadProfileImage(selectedImage);

      if (data && data.profilePicture) {
        const newProfilePic = `${API_BASE_URL}${data.profilePicture}`;

        setProfile((prev) => ({ ...prev, profilePicture: newProfilePic }));
        setUser((prev) => (prev ? { ...prev, profilePicture: newProfilePic } : null));

        setSelectedImage(null);
        setImagePreview(null);
        setShowImageActions(false);
        setAvatarError(false);

        alert('Profile picture updated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      console.error('Profile picture upload failed:', error);

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 413) {
        alert('Image file is too large. Please choose a smaller image.');
      } else if (status === 400) {
        alert('Invalid image format. Please choose a valid image file.');
      } else {
        alert('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImageActions(true);
      setAvatarError(false);
    }
  };

  const cancelProfilePicUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShowImageActions(false);
    setAvatarError(false);
  };

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setIsLoading(true);
    try {
      await updateNotificationPreferences(user._id, notifications);
      alert('Notification preferences updated successfully');
    } catch (error) {
      console.error('Notification update failed:', error);
      alert('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------- Render --------------------------------- */

  const avatarSrc = imagePreview || (!avatarError && profile.profilePicture) || '';
  const roleLabel = formatRole(user?.role);
  const memberSince = formatDate(profile.createdAt);

  return (
    <div className="text-slate-900">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1230] tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account, security, and store branding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
        {/* Sidebar navigation */}
        <nav
          aria-label="Settings sections"
          className="bg-white border border-slate-200 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleTabs.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              aria-current={activeTab === index ? 'page' : undefined}
              onClick={(e) => {
                setActiveTab(index);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap px-3.5 h-10 rounded-lg text-sm font-semibold text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1230] focus-visible:ring-offset-1 ${activeTab === index
                ? 'bg-[#0b1230] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {/* ------------------------------ Profile ------------------------------ */}
          {activeTab === 0 && (
            <SectionCard
              title="Your profile"
              description="How you appear in Xpay. Visible to your agents and your school."
              onSubmit={handleProfileUpdate}
              footer={
                <>
                  <button
                    type="button"
                    onClick={handleProfileCancel}
                    disabled={!profileDirty || isLoading}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={!profileDirty || isLoading} className={btnPrimary}>
                    {isLoading ? 'Saving...' : 'Save changes'}
                  </button>
                </>
              }
            >
              {/* Identity row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 pb-6 border-b border-slate-200">
                <div className="relative shrink-0 w-fit">
                  {avatarSrc ? (
                    <img
                      className="h-16 w-16 rounded-2xl object-cover"
                      src={avatarSrc}
                      alt="Profile"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="h-16 w-16 rounded-2xl bg-[#0b1230] text-white text-xl font-bold flex items-center justify-center"
                    >
                      {getInitials(profile.name)}
                    </div>
                  )}
                  <label
                    title="Change photo"
                    className="absolute -bottom-1.5 -right-1.5 h-7 w-7 flex items-center justify-center bg-white text-[#0b1230] border border-slate-200 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 focus-within:ring-2 focus-within:ring-[#0b1230]"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span className="sr-only">Change profile photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePicChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  {loading ? (
                    <div className="animate-pulse space-y-2.5">
                      <div className="h-5 w-40 bg-slate-200 rounded" />
                      <div className="h-3.5 w-52 bg-slate-200 rounded" />
                      <div className="h-6 w-60 bg-slate-200 rounded-full" />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-slate-900 truncate">{profile.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{profile.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {roleLabel && (
                          <span className={chipCls}>
                            Role <span className="font-semibold text-slate-900">{roleLabel}</span>
                          </span>
                        )}
                        {memberSince && (
                          <span className={chipCls}>
                            Member since <span className="font-semibold text-slate-900">{memberSince}</span>
                          </span>
                        )}
                        {user?.wallet && (
                          <span className={chipCls}>
                            Wallet{' '}
                            <span className="font-semibold text-slate-900">
                              {user.wallet.currency} {user.wallet.balance.toLocaleString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {showImageActions && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleProfilePicUpload}
                        disabled={uploadingImage}
                        className={`${btnPrimary} !h-8 !px-3 !text-xs`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {uploadingImage ? 'Uploading...' : 'Save photo'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelProfilePicUpload}
                        disabled={uploadingImage}
                        className={`${btnSecondary} !h-8 !px-3 !text-xs`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <label htmlFor="profile-name" className={labelCls}>Full name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={inputCls}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className={labelCls}>Phone number</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={inputCls}
                    placeholder="Phone number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="profile-email" className={labelCls}>Email address</label>
                  <div className="relative">
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      className={`${inputCls} pr-10`}
                      disabled
                      readOnly
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className={hintCls}>
                    To change your email, contact Xpay support. We'll send a verification link to the new address.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ------------------------------ Security ----------------------------- */}
          {activeTab === 1 && (
            <SectionCard title="Security" description="Manage your password and transaction PIN.">
              {/* Password */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  Change password
                </h3>
                <form className="space-y-5" onSubmit={handlePasswordUpdate}>
                  <div>
                    <label className={labelCls}>Current password</label>
                    <SecretInput
                      value={passwordData.currentPassword}
                      onChange={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
                      show={showPassword.current}
                      onToggle={() => setShowPassword((p) => ({ ...p, current: !p.current }))}
                      placeholder="Current password"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <label className={labelCls}>New password</label>
                      <SecretInput
                        value={passwordData.newPassword}
                        onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })}
                        show={showPassword.new}
                        onToggle={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                        placeholder="New password"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Confirm password</label>
                      <SecretInput
                        value={passwordData.confirmPassword}
                        onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
                        show={showPassword.confirm}
                        onToggle={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className={btnPrimary} disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* PIN */}
              {user?.role !== 'admin' && (
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    {user?.isPinSet ? 'Update security PIN' : 'Set up security PIN'}
                  </h3>

                  <div className="mb-5 flex items-start gap-2.5 p-3 bg-[#eef1f8] rounded-lg">
                    <Info className="w-4 h-4 text-[#0b1230] mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700">
                      {user?.isPinSet
                        ? 'You have a security PIN set. Enter your current PIN and create a new 4-digit PIN to update it.'
                        : 'Enhance your account security by setting up a 4-digit PIN. This PIN will be required for sensitive operations.'}
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={handlePinUpdate}>
                    {user?.isPinSet ? (
                      <>
                        <div>
                          <label className={labelCls}>Current PIN</label>
                          <SecretInput
                            numeric
                            required
                            disabled={isLoading}
                            value={pinData.currentPin}
                            onChange={(v) => setPinData({ ...pinData, currentPin: v })}
                            show={showPin.current}
                            onToggle={() => setShowPin((p) => ({ ...p, current: !p.current }))}
                            placeholder="Enter current 4-digit PIN"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                          <div>
                            <label className={labelCls}>New PIN</label>
                            <SecretInput
                              numeric
                              required
                              disabled={isLoading}
                              value={pinData.pin}
                              onChange={(v) => setPinData({ ...pinData, pin: v })}
                              show={showPin.new}
                              onToggle={() => setShowPin((p) => ({ ...p, new: !p.new }))}
                              placeholder="Enter new 4-digit PIN"
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Confirm PIN</label>
                            <SecretInput
                              numeric
                              required
                              disabled={isLoading}
                              value={pinData.newPin}
                              onChange={(v) => setPinData({ ...pinData, newPin: v })}
                              show={showPin.confirm}
                              onToggle={() => setShowPin((p) => ({ ...p, confirm: !p.confirm }))}
                              placeholder="Confirm 4-digit PIN"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={handleOpenResetModal}
                            className="text-sm text-[#0b1230] hover:underline font-semibold underline-offset-4"
                          >
                            Forgot PIN?
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isLoading ||
                              pinData.currentPin.length !== 4 ||
                              pinData.pin.length !== 4 ||
                              pinData.newPin.length !== 4
                            }
                            className={btnPrimary}
                          >
                            {isLoading ? 'Updating PIN...' : 'Update PIN'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                          <div>
                            <label className={labelCls}>Create PIN</label>
                            <SecretInput
                              numeric
                              required
                              disabled={isLoading}
                              value={pinData.pin}
                              onChange={(v) => setPinData({ ...pinData, pin: v })}
                              show={showPin.new}
                              onToggle={() => setShowPin((p) => ({ ...p, new: !p.new }))}
                              placeholder="Create 4-digit PIN"
                            />
                            <p className={hintCls}>Choose a secure 4-digit PIN</p>
                          </div>
                          <div>
                            <label className={labelCls}>Confirm PIN</label>
                            <SecretInput
                              numeric
                              required
                              disabled={isLoading}
                              value={pinData.newPin}
                              onChange={(v) => setPinData({ ...pinData, newPin: v })}
                              show={showPin.confirm}
                              onToggle={() => setShowPin((p) => ({ ...p, confirm: !p.confirm }))}
                              placeholder="Confirm 4-digit PIN"
                            />
                            <p className={hintCls}>Re-enter your PIN to confirm</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading || pinData.pin.length !== 4 || pinData.newPin.length !== 4}
                            className={btnPrimary}
                          >
                            {isLoading ? 'Setting PIN...' : 'Set PIN'}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              )}
            </SectionCard>
          )}

          {/* --------------------------- Notifications --------------------------- */}
          {activeTab === 2 && (
            <SectionCard
              title="Notifications"
              description="Choose how you want to hear from us."
              onSubmit={handleNotificationUpdate}
              footer={
                <button type="submit" disabled={isLoading} className={btnPrimary}>
                  {isLoading ? 'Saving...' : 'Save preferences'}
                </button>
              }
            >
              <div className="divide-y divide-slate-200 -my-2">
                {notificationOptions.map(({ key, id, Icon, title, desc }) => (
                  <div key={key} className="flex items-center gap-3.5 py-4">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-[#0b1230] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label htmlFor={id} className="text-sm font-semibold text-slate-900 cursor-pointer">
                        {title}
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      id={id}
                      label={title}
                      checked={notifications[key]}
                      onChange={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ----------------------------- Brand & Store ------------------------- */}
          {activeTab === 3 && (
            <SectionCard
              title="Brand & store"
              description="Your school's primary and secondary colors. They style your dashboard, cards, and branding."
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetColors();
                      setSnackbar({ open: true, message: 'Colors reset to default academic theme', severity: 'success' });
                    }}
                    disabled={!isCustomized}
                    className={`${btnSecondary} sm:mr-auto`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to default
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const success = saveColors();
                      setSnackbar(
                        success
                          ? { open: true, message: 'School primary & secondary colors saved successfully!', severity: 'success' }
                          : { open: true, message: 'Failed to save colors. Please try again.', severity: 'error' },
                      );
                    }}
                    className={btnPrimary}
                  >
                    <Check className="w-4 h-4" />
                    Save colors
                  </button>
                </>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    title: 'Primary color',
                    desc: 'Headers, navigation, and key actions',
                    value: primaryColor,
                    set: setPrimaryColor,
                    palette: PRIMARY_PALETTE,
                    placeholder: '#1E40AF',
                  },
                  {
                    title: 'Secondary color',
                    desc: 'Highlights, badges, and secondary buttons',
                    value: secondaryColor,
                    set: setSecondaryColor,
                    palette: SECONDARY_PALETTE,
                    placeholder: '#F59E0B',
                  },
                ].map((c) => (
                  <div key={c.title} className="rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                        {c.value.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={c.value}
                        onChange={(e) => c.set(e.target.value)}
                        className="w-11 h-11 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                        title={`Pick ${c.title.toLowerCase()}`}
                      />
                      <div className="flex-1">
                        <label className={labelCls}>Hex code</label>
                        <input
                          type="text"
                          value={c.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            c.set(val.startsWith('#') || val === '' ? val : `#${val}`);
                          }}
                          placeholder={c.placeholder}
                          maxLength={7}
                          className={`${inputCls} !h-9 font-mono uppercase`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-900 block mb-2">Suggested colors</span>
                      <div className="flex flex-wrap gap-2">
                        {c.palette.map((hex: string) => {
                          const selected = c.value.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => c.set(hex)}
                              aria-label={`Use ${hex}`}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${selected ? 'ring-2 ring-offset-2 ring-[#0b1230]' : ''
                                }`}
                              style={{ backgroundColor: hex }}
                              title={hex}
                            >
                              {selected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  Academic presets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SCHOOL_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0b1230] bg-white transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1230]"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-md" style={{ backgroundColor: preset.primary }} />
                        <div className="w-5 h-5 rounded-md" style={{ backgroundColor: preset.secondary }} />
                        <span className="text-xs font-bold text-slate-900 ml-1">{preset.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ------------------------- Academic Calendar ------------------------- */}
          {activeTab === 4 && showAcademicCalendar && (
            <SectionCard
              title="Academic calendar"
              description="Set the key dates for the current session and control how parents are notified and how students are promoted."
              footer={
                <button type="button" className={btnPrimary}>
                  <Check className="w-4 h-4" />
                  Save academic calendar
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Vacation date</h3>
                      <p className="text-xs text-slate-500">Last day of the term</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    aria-label="Vacation date"
                    value={academicDates.vacationDate}
                    onChange={(e) => setAcademicDates({ ...academicDates, vacationDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Resumption date</h3>
                      <p className="text-xs text-slate-500">First day of the next term</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    aria-label="Resumption date"
                    value={academicDates.resumptionDate}
                    min={academicDates.vacationDate || undefined}
                    onChange={(e) => setAcademicDates({ ...academicDates, resumptionDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 text-[#0b1230] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Promotion date</h3>
                      <p className="text-xs text-slate-500">When students move to the next class</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    aria-label="Promotion date"
                    value={academicDates.promotionDate}
                    onChange={(e) => setAcademicDates({ ...academicDates, promotionDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <BellRing className="w-4 h-4 text-slate-500" />
                  Automation
                </h3>

                <div className="divide-y divide-slate-200">
                  <div className="flex items-center gap-3.5 py-4">
                    <div className="flex-1 min-w-0">
                      <label htmlFor="notify-parents" className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Notify parents of vacation and resumption dates
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Parents will be informed of the vacation and resumption dates set above.
                      </p>
                    </div>
                    <Toggle
                      id="notify-parents"
                      label="Notify parents of vacation and resumption dates"
                      checked={academicToggles.notifyParents}
                      onChange={() => setAcademicToggles((p) => ({ ...p, notifyParents: !p.notifyParents }))}
                    />
                  </div>

                  <div className="flex items-center gap-3.5 py-4">
                    <div className="flex-1 min-w-0">
                      <label htmlFor="auto-promote" className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Run promotion automatically on the promotion date
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Students will be promoted automatically when the promotion date arrives.
                      </p>
                    </div>
                    <Toggle
                      id="auto-promote"
                      label="Run promotion automatically on the promotion date"
                      checked={academicToggles.autoPromote}
                      onChange={() => setAcademicToggles((p) => ({ ...p, autoPromote: !p.autoPromote }))}
                    />
                  </div>
                </div>

                {academicToggles.autoPromote && (
                  <div className="flex items-start gap-2 p-3 mt-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      Promotion changes every student's class. Make sure results are finalized before the promotion date.
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ------------------------------ PIN reset modal ------------------------------ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b1230]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 border border-slate-200"
          >
            <div className="text-center mb-7">
              <h2 className="text-xl font-bold text-slate-900">
                {resetStep === 'pin' ? 'Set new PIN' : 'Verify OTP'}
              </h2>
              <p className="text-slate-500 text-sm mt-1.5">
                {resetStep === 'pin'
                  ? 'Enter 4 digits to secure your account'
                  : `Enter the code sent to ${profile?.email}`}
              </p>
            </div>

            {resetStep === 'pin' ? (
              <div className="space-y-6">
                <div
                  className="flex justify-between gap-3 cursor-pointer"
                  onClick={() => document.getElementById('hidden-pin-input')?.focus()}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all duration-150
                ${pinData.pin.length === i ? 'border-[#0b1230] bg-slate-50' : 'border-slate-200 bg-slate-50'}
                ${pinData.pin[i] ? 'border-[#0b1230] bg-white text-slate-900' : 'text-slate-300'}`}
                    >
                      {pinData.pin[i] ? (showPin.modal ? pinData.pin[i] : '●') : ''}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end -mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => ({ ...prev, modal: !prev.modal }))}
                    className="text-xs text-[#0b1230] hover:underline font-semibold flex items-center gap-1"
                  >
                    {showPin.modal ? (
                      <>
                        <EyeOff size={14} /> Hide PIN
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Show PIN
                      </>
                    )}
                  </button>
                </div>

                <input
                  id="hidden-pin-input"
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  className="absolute opacity-0 h-0 w-0"
                  value={pinData.pin}
                  onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />

                <button
                  onClick={handleRequestOtp}
                  disabled={isLoading || pinData.pin.length < 4}
                  className={`${btnPrimary} w-full !h-12 !text-base`}
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-slate-900 text-3xl font-bold tracking-widest focus:border-[#0b1230] focus:bg-white outline-none transition-all"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResetStep('pin');
                      setOtpValue('');
                    }}
                    className={`${btnSecondary} flex-1 !h-12`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalReset}
                    disabled={isLoading || otpValue.length < 6}
                    className={`${btnPrimary} flex-[2] !h-12 !text-base`}
                  >
                    {isLoading ? 'Verifying...' : 'Reset PIN'}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setIsModalOpen(false);
                setResetStep('pin');
                setPinData({ ...pinData, pin: '' });
                setOtpValue('');
              }}
              className="mt-6 w-full text-slate-500 text-sm font-semibold hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[110] px-5 py-3 rounded-lg shadow-xl text-white text-sm ${snackbar.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
        >
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button aria-label="Dismiss" onClick={() => setSnackbar({ ...snackbar, open: false })}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;