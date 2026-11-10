import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Landmark,
  Edit,
  Lock,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  Clock,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { WithdrawalValidation } from '../../types';
import {
  generateOtp,
  getBanks,
  getUserDetails,
  getUserTransactions,
  resolveAccount,
  submitWithdrawal,
  validateWithdrawal,
  verifyOtp,
} from '../../services';

/// ---------- Types ----------
interface User {
  name: string;
  wallet: {
    balance: number;
    currency: string;
    walletId: string;
  };
}

interface Bank {
  id: string;
  name: string;
  code: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

type WithdrawalStatus = 'processing' | 'paid' | 'failed';

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: Date;
  receiverAccount: string;
  receiverBank: string; // bank code or name, as sent by the API
}

/// ---------- Constants ----------
const steps = ['Select Bank', 'Account Details', 'Verify OTP'];

const MIN_WITHDRAWAL = 1000;
const QUICK_ADD = [5000, 10000, 25000];
const RECENT_LIMIT = 5;

// Which transactionType values count as a "withdrawal".
// Add more here (e.g. a pending/failed type) if your backend uses them.
const WITHDRAWAL_TYPES = ['withdrawal_completed'];

const naira = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '—';

const maskAccount = (acct: string) =>
  acct && acct.length >= 6 ? `${acct.slice(0, 4)} · ··${acct.slice(-2)}` : acct || '—';

const relativeTime = (d: Date): string => {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24 && d.toDateString() === new Date().toDateString()) return `${hrs}h ago`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const mapStatus = (raw: unknown): WithdrawalStatus => {
  const s = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (s.includes('pending') || s.includes('processing')) return 'processing';
  if (s.includes('fail') || s.includes('cancel') || s.includes('reject')) return 'failed';
  return 'paid';
};

const STATUS_STYLES: Record<
  WithdrawalStatus,
  { label: string; icon: React.ReactNode; tile: string; text: string }
> = {
  processing: {
    label: 'PROCESSING',
    icon: <Clock size={16} />,
    tile: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
  },
  paid: {
    label: 'PAID',
    icon: <Check size={16} />,
    tile: 'bg-green-50 text-green-600',
    text: 'text-green-600',
  },
  failed: {
    label: 'FAILED',
    icon: <X size={16} />,
    tile: 'bg-red-50 text-red-500',
    text: 'text-red-500',
  },
};

const SWithdrawalPage: React.FC = () => {
  // ============================================================
  // CONFIRMED bank details — the ONLY source of truth for what is
  // saved in the backend. Only updates after handleSetBank() succeeds.
  // ============================================================
  const [confirmedBank, setConfirmedBank] = useState<string>('');
  const [confirmedBankCode, setConfirmedBankCode] = useState<string>('');
  const [confirmedAccountNumber, setConfirmedAccountNumber] = useState<string>('');
  const [confirmedAccountName, setConfirmedAccountName] = useState<string>('');

  // ============================================================
  // DRAFT state — scratch space used ONLY while the bank modal is open.
  // ============================================================
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isBankSet, setIsBankSet] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState<boolean>(true);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Withdrawal form
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalNote, setWithdrawalNote] = useState<string>('');
  const [withdrawalError, setWithdrawalError] = useState<string>('');
  const [withdrawalPin, setWithdrawalPin] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [userHasPin, setUserHasPin] = useState<boolean>(false);
  const [withdrawalValidation, setWithdrawalValidation] = useState<WithdrawalValidation | null>(null);
  const [feePreview, setFeePreview] = useState<number | null>(null);

  // Server data
  const [user, setUser] = useState<User | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankLoading, setBankLoading] = useState<boolean>(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState<boolean>(true);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ---------- Fetchers ----------
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await getUserDetails();
      if (!response) {
        console.error('Failed to fetch user profile');
        return;
      }

      type SafeUserInfo = {
        name?: string;
        firstName?: string;
        lastName?: string;
        bankDetails?: {
          bankName?: string;
          accountNumber?: string;
          accountName?: string;
          bankCode?: string;
        };
        withdrawalBank?: string;
        withdrawalAccountNumber?: string;
        withdrawalAccountName?: string;
        isPinSet?: boolean;
        [key: string]: unknown;
      };
      type SafeWalletInfo = {
        balance?: number;
        currency?: string;
        walletId?: string;
        [key: string]: unknown;
      };

      const userInfo: SafeUserInfo = response.user?.data || response.data || response.user || response;
      const walletInfo: SafeWalletInfo = response.user?.wallet || response.wallet || {};

      setUser({
        name: userInfo.name ?? `${userInfo.firstName ?? ''} ${userInfo.lastName ?? ''}`.trim(),
        wallet: {
          balance: walletInfo.balance ?? 0,
          currency: walletInfo.currency ?? 'NGN',
          walletId: walletInfo.walletId ?? '',
        },
      });
      setUserHasPin(!!userInfo.isPinSet);

      // Feeds CONFIRMED state only — never the modal draft.
      const bankName = userInfo.bankDetails?.bankName ?? userInfo.withdrawalBank;
      const acctNo = userInfo.bankDetails?.accountNumber ?? userInfo.withdrawalAccountNumber;
      const acctName = userInfo.bankDetails?.accountName ?? userInfo.withdrawalAccountName;
      const bankCode = userInfo.bankDetails?.bankCode;

      if (bankName && acctNo && acctName) {
        setConfirmedBank(bankName);
        setConfirmedAccountNumber(acctNo);
        setConfirmedAccountName(acctName);
        if (bankCode) setConfirmedBankCode(bankCode);
        setIsBankSet(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingBankDetails(false);
    }
  }, []);

  // Fetch all transactions, keep only withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      const data = (await getUserTransactions()) as unknown as
        | { transactions?: unknown[]; data?: unknown }
        | unknown[];

      let list: unknown[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data?.transactions) {
        list = data.transactions;
      } else if (data?.data) {
        list = Array.isArray(data.data) ? data.data : [data.data];
      }

      const records: WithdrawalRecord[] = list
        .map((item) => item as Record<string, unknown> & { metadata?: Record<string, unknown> })
        .filter((t) => WITHDRAWAL_TYPES.includes(String(t.transactionType)))
        .map((t, i) => ({
          id: String(t._id || t.id || `W${i}`),
          amount: Math.abs(Number(t.amount) || 0),
          status: mapStatus(t.status),
          createdAt: new Date(String(t.createdAt || t.date || Date.now())),
          receiverAccount: String(t.metadata?.receiverAccount ?? ''),
          receiverBank: String(t.metadata?.receiverBank ?? ''),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setWithdrawals(records);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const banksData = await getBanks();
        setBanks(
          banksData.map((bank) => ({
            id: bank.id.toString(),
            name: bank.name,
            code: bank.code,
          }))
        );
      } catch (error) {
        console.error('Error fetching banks:', error);
        setBanks([]);
      } finally {
        setBankLoading(false);
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    setIsLoadingBankDetails(true);
    fetchUserProfile();
    fetchWithdrawals();
  }, [fetchUserProfile, fetchWithdrawals]);

  // ---------- Derived values ----------
  const availableBalance = user?.wallet?.balance || 0;
  const parsedAmount = parseFloat(withdrawalAmount);
  const amountIsValid = !isNaN(parsedAmount) && parsedAmount >= MIN_WITHDRAWAL;

  const stats = useMemo(() => {
    const now = new Date();
    const processing = withdrawals.filter((w) => w.status === 'processing');
    const thisMonth = withdrawals.filter(
      (w) =>
        w.status === 'paid' &&
        w.createdAt.getMonth() === now.getMonth() &&
        w.createdAt.getFullYear() === now.getFullYear()
    );
    return {
      processingTotal: processing.reduce((s, w) => s + w.amount, 0),
      processingCount: processing.length,
      monthTotal: thisMonth.reduce((s, w) => s + w.amount, 0),
      monthCount: thisMonth.length,
    };
  }, [withdrawals]);

  const bankNameFor = (codeOrName: string) =>
    banks.find((b) => b.code === codeOrName)?.name || (/^\d+$/.test(codeOrName) ? confirmedBank : codeOrName) || confirmedBank;

  const visibleWithdrawals = showAllWithdrawals ? withdrawals : withdrawals.slice(0, RECENT_LIMIT);

  // Live fee preview (debounced) so the summary matches the design
  useEffect(() => {
    if (!isBankSet || !amountIsValid || parsedAmount > availableBalance) {
      setFeePreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const v = await validateWithdrawal(parsedAmount);
        if (!cancelled) setFeePreview(v.charge || 0);
      } catch {
        if (!cancelled) setFeePreview(null);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parsedAmount, amountIsValid, isBankSet, availableBalance]);

  // ---------- Bank modal handlers ----------
  const resetModalForm = () => {
    setSelectedBank('');
    setSelectedBankCode('');
    setAccountNumber('');
    setAccountName('');
    setOtp('');
    setOtpSent(false);
    setActiveStep(0);
    setVerificationStatus(null);
  };

  const handleOpenModal = () => {
    setSelectedBank(confirmedBank);
    setSelectedBankCode(confirmedBankCode);
    setAccountNumber(confirmedAccountNumber);
    setAccountName(confirmedAccountName);
    setOtp('');
    setOtpSent(false);
    setVerificationStatus(null);
    setActiveStep(0);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    const hadUnsavedProgress = activeStep > 0 || verificationStatus === 'success' || otpSent;
    setOpenModal(false);
    resetModalForm();
    if (hadUnsavedProgress) {
      setSnackbar({
        open: true,
        message: 'Bank update cancelled — no changes were saved.',
        severity: 'info',
      });
    }
  };

  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10) {
      setVerificationStatus('error');
      setAccountName('');
      return;
    }
    if (!selectedBankCode) {
      alert('Bank code not found. Please reselect your bank.');
      return;
    }

    setLoading(true);
    try {
      const data = await resolveAccount(accountNumber, selectedBankCode);
      const responseData = data as { account_name?: string; data?: { account_name?: string } };
      setAccountName(responseData.account_name || responseData.data?.account_name || '');
      setVerificationStatus('success');
    } catch (error: unknown) {
      console.error('Error verifying account:', error);
      alert(getErrorMessage(error, 'Failed to verify account. Please check account number and try again.'));
      setVerificationStatus('error');
      setAccountName('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await generateOtp();
      setOtpSent(true);
      alert('OTP sent to your registered email address.');
    } catch (error: unknown) {
      console.error('Error sending OTP:', error);
      alert(getErrorMessage(error, 'An error occurred while sending OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // The ONLY place CONFIRMED bank state may change.
  const handleSetBank = async () => {
    if (!selectedBank || !accountNumber || !otp || !accountName) {
      alert('Please fill in all fields and enter the OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        otp,
        accountName,
        accountNumber,
        bankName: selectedBank,
        bankCode: selectedBankCode || '',
      });

      setConfirmedBank(selectedBank);
      setConfirmedBankCode(selectedBankCode);
      setConfirmedAccountNumber(accountNumber);
      setConfirmedAccountName(accountName);
      setIsBankSet(true);

      setOpenModal(false);
      resetModalForm();
      setSnackbar({
        open: true,
        message: 'Withdrawal bank details updated successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      console.error('Error verifying OTP:', error);
      alert(getErrorMessage(error, 'An error occurred while verifying OTP.'));
    } finally {
      setLoading(false);
    }
  };

  // ---------- Withdrawal handlers ----------
  const addToAmount = (inc: number) => {
    const current = parseFloat(withdrawalAmount) || 0;
    setWithdrawalAmount(String(Math.min(current + inc, availableBalance)));
    setWithdrawalError('');
  };

  const handleCancelForm = () => {
    setWithdrawalAmount('');
    setWithdrawalNote('');
    setWithdrawalError('');
    setFeePreview(null);
  };

  const handleWithdrawalSubmit = async () => {
    setWithdrawalError('');
    setWithdrawalValidation(null);

    if (!userHasPin) {
      setSnackbar({
        open: true,
        message: 'No PIN found. Please set your PIN in the settings page before making withdrawals.',
        severity: 'warning',
      });
      return;
    }

    if (!withdrawalAmount) {
      setWithdrawalError('Please enter an amount to withdraw.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setWithdrawalError('Please enter a valid amount.');
      return;
    }
    if (parsedAmount < MIN_WITHDRAWAL) {
      setWithdrawalError(`The minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}.`);
      return;
    }
    if (parsedAmount > availableBalance) {
      setWithdrawalError('Insufficient balance.');
      return;
    }

    setLoading(true);
    try {
      const validationData = await validateWithdrawal(parsedAmount);
      const amount = validationData.amount || parsedAmount;
      const charge = validationData.charge || 0;

      setWithdrawalValidation({
        amount,
        charge,
        total: amount + charge,
        account_name: validationData.account_name || confirmedAccountName || '',
        account_number: validationData.account_number || confirmedAccountNumber || '',
        bank_name: validationData.bank_name || confirmedBank || '',
      });
      setShowPinModal(true);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to validate withdrawal');
      setWithdrawalError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePinConfirmation = async () => {
    if (!withdrawalPin || withdrawalPin.length !== 4) {
      setSnackbar({ open: true, message: 'Please enter your 4-digit PIN.', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Always submit against CONFIRMED bank details, never the modal draft.
      await submitWithdrawal({
        amount: parseFloat(withdrawalAmount),
        description: withdrawalNote,
        pin: withdrawalPin,
        account_name: confirmedAccountName || '',
        account_number: confirmedAccountNumber || '',
        bank_code: confirmedBankCode || '',
      });

      setWithdrawalAmount('');
      setWithdrawalNote('');
      setShowPinModal(false);
      setWithdrawalPin('');
      setWithdrawalValidation(null);
      setFeePreview(null);

      setSnackbar({
        open: true,
        message: 'Withdrawal request submitted successfully! Your funds will be processed within 24 hours.',
        severity: 'success',
      });

      // Refresh balance + recent withdrawals
      fetchUserProfile();
      fetchWithdrawals();
    } catch (error: unknown) {
      console.error('Withdrawal Error:', error);
      const apiMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || '';
      const lower = apiMessage.toLowerCase();
      const message =
        lower.includes('pin') || lower.includes('invalid')
          ? 'Invalid PIN. Please check your PIN and try again.'
          : apiMessage || 'An error occurred while processing your request. Please try again.';

      setSnackbar({ open: true, message, severity: 'error' });
      setShowPinModal(false);
      setWithdrawalPin('');
    } finally {
      setLoading(false);
    }
  };

  // Fee comes out of the amount: balance drops by `amount`, recipient gets amount - fee
  const youReceive =
    amountIsValid && feePreview !== null ? Math.max(parsedAmount - feePreview, 0) : null;

  // ---------- Render ----------
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
        <p className="text-sm text-slate-500">Move money from your wallet to your linked bank account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
        {/* ============ LEFT COLUMN ============ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Balance hero */}
          <div className="bg-[#0b1437] rounded-xl text-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs tracking-wide text-slate-400">Available balance</p>
                <p className="text-4xl font-bold mt-1">{naira(availableBalance)}</p>
                <p className="text-xs text-slate-400 mt-3">
                  Last updated just now · Settles automatically to your bank
                </p>
              </div>
              <div className="hidden sm:block w-px self-stretch bg-white/10" />
              <div className="flex gap-10">
                <div>
                  <p className="text-xs text-slate-400">Processing</p>
                  <p className="text-xl font-bold mt-1">{naira(stats.processingTotal)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.processingCount} {stats.processingCount === 1 ? 'request' : 'requests'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">This month</p>
                  <p className="text-xl font-bold mt-1">{naira(stats.monthTotal)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.monthCount} {stats.monthCount === 1 ? 'payout' : 'payouts'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal form */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            {isLoadingBankDetails ? (
              <div className="flex flex-col items-center justify-center py-14">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-3">Loading withdrawal bank details...</p>
              </div>
            ) : !isBankSet ? (
              <div className="text-center py-10">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Landmark className="text-slate-500" size={22} />
                </div>
                <p className="text-slate-700 font-medium mb-1">Add a bank account to withdraw</p>
                <p className="text-sm text-slate-500 mb-5">
                  Your withdrawals will be sent to this account.
                </p>
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-2 bg-[#0b1437] hover:bg-[#162056] text-white px-5 py-2.5 rounded-lg transition"
                >
                  <Landmark size={18} />
                  Set withdrawal bank
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="withdrawalAmount" className="text-sm font-semibold text-slate-800">
                    Withdrawal amount
                  </label>
                  <span className="text-xs text-slate-400">Min ₦{MIN_WITHDRAWAL.toLocaleString()}</span>
                </div>

                <div
                  className={`flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-4 border ${withdrawalError ? 'border-red-400' : 'border-transparent'
                    } focus-within:ring-2 focus-within:ring-blue-500`}
                >
                  <span className="text-2xl font-bold text-slate-400">₦</span>
                  <input
                    id="withdrawalAmount"
                    type="number"
                    inputMode="decimal"
                    className="flex-1 min-w-0 bg-transparent text-3xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none"
                    value={withdrawalAmount}
                    onChange={(e) => {
                      setWithdrawalAmount(e.target.value);
                      setWithdrawalError('');
                    }}
                    placeholder="0"
                  />
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-md px-2.5 py-1.5">
                    NGN
                  </span>
                </div>

                {withdrawalError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <AlertCircle size={16} />
                    <p>{withdrawalError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {QUICK_ADD.map((inc) => (
                    <button
                      key={inc}
                      onClick={() => addToAmount(inc)}
                      className="text-sm text-slate-700 bg-white border border-slate-200 hover:border-slate-400 rounded-full px-4 py-1.5 transition"
                    >
                      +{inc.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setWithdrawalAmount(String(availableBalance));
                      setWithdrawalError('');
                    }}
                    disabled={availableBalance <= 0}
                    className="text-sm font-semibold text-white bg-[#0b1437] hover:bg-[#162056] disabled:opacity-50 rounded-full px-4 py-1.5 transition"
                  >
                    Withdraw all
                  </button>
                </div>

                {/* Settles to */}
                <p className="text-sm font-semibold text-slate-800 mt-6 mb-2">Settles to</p>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="w-11 h-11 rounded-lg bg-emerald-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {initials(confirmedBank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{confirmedAccountName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {confirmedBank} · {confirmedAccountNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition"
                    title="Change withdrawal bank details"
                  >
                    <Edit size={14} />
                    Change
                  </button>
                </div>

                {/* Note */}
                <label htmlFor="withdrawalNote" className="block text-sm font-semibold text-slate-800 mt-6 mb-2">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="withdrawalNote"
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={withdrawalNote}
                  onChange={(e) => setWithdrawalNote(e.target.value)}
                  placeholder="e.g. September stock refill"
                />

                {/* Summary */}
                <div className="mt-6 border border-dashed border-slate-300 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Withdrawal amount</span>
                    <span className="font-semibold text-slate-800">
                      {amountIsValid ? naira(parsedAmount) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Processing fee</span>
                    <span className="font-semibold text-slate-800">
                      {feePreview !== null ? naira(feePreview) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                    <span className="font-semibold text-slate-900">You&apos;ll receive</span>
                    <span className="text-xl font-bold text-green-600">
                      {youReceive !== null ? naira(youReceive) : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelForm}
                    className="px-6 py-3 rounded-lg border border-slate-200 text-slate-800 font-semibold hover:border-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0b1437] hover:bg-[#162056] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg transition"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    Continue to confirm
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                  <Lock size={12} />
                  You&apos;ll be asked to enter your PIN before this withdrawal is sent.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent withdrawals */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="p-5 pb-3">
              <h2 className="font-bold text-slate-900">Recent withdrawals</h2>
              <p className="text-xs text-slate-400">
                {showAllWithdrawals ? 'All withdrawals' : 'Most recent'}
              </p>
            </div>

            {withdrawalsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="px-5 py-10 text-sm text-center text-slate-500 border-t border-slate-100">
                No withdrawals yet. Your payouts will show up here.
              </p>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto">
                {visibleWithdrawals.map((w) => {
                  const st = STATUS_STYLES[w.status];
                  return (
                    <li key={w.id} className="flex items-center gap-3 px-5 py-3.5 border-t border-slate-100">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${st.tile}`}>
                        {st.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{naira(w.amount)}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {bankNameFor(w.receiverBank)} · {maskAccount(w.receiverAccount)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[11px] font-bold ${st.text}`}>{st.label}</p>
                        <p className="text-xs text-slate-400">{relativeTime(w.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {withdrawals.length > RECENT_LIMIT && (
              <button
                onClick={() => setShowAllWithdrawals((v) => !v)}
                className="w-full text-sm font-semibold text-slate-800 py-4 border-t border-slate-100 hover:bg-slate-50 rounded-b-xl transition"
              >
                {showAllWithdrawals ? 'Show fewer' : 'View all withdrawals →'}
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex gap-3">
              <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-800">Processing time.</span> Withdrawals are
                typically processed within 24 hours on business days. Weekend requests may take longer.
              </p>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex gap-3">
              <ShieldCheck size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-800">Double-check your bank details.</span>{' '}
                Withdrawals to the wrong account cannot be reversed. Change bank details anytime using
                the Change button.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Confirm withdrawal</h2>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setWithdrawalPin('');
                  setWithdrawalValidation(null);
                }}
                className="text-slate-500 hover:text-slate-700"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {withdrawalValidation ? (
              <div className="mb-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-medium text-slate-900">{withdrawalValidation.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account number</span>
                  <span className="font-medium text-slate-900">{withdrawalValidation.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account name</span>
                  <span className="font-medium text-slate-900 text-right">{withdrawalValidation.account_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium text-slate-900">{naira(withdrawalValidation.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing fee</span>
                  <span className="font-medium text-slate-900">{naira(withdrawalValidation.charge)}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold text-slate-900">You&apos;ll receive</span>
                  <span className="font-bold text-green-600">
                    {naira(Math.max(withdrawalValidation.amount - withdrawalValidation.charge, 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-slate-100 rounded-md">
                <p className="text-slate-600">Loading withdrawal details...</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-slate-700 mb-2">Enter your 4-digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest text-slate-900"
                value={withdrawalPin}
                onChange={(e) => setWithdrawalPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
            </div>

            <button
              onClick={handlePinConfirmation}
              disabled={loading || withdrawalPin.length !== 4 || !withdrawalValidation}
              className="w-full flex items-center justify-center gap-2 bg-[#0b1437] hover:bg-[#162056] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock size={18} />
              )}
              Confirm withdrawal
            </button>
          </div>
        </div>
      )}

      {/* Bank Setup Modal — DRAFT state only */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Set withdrawal bank details</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-700"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeStep >= index ? 'bg-[#0b1437] text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs text-slate-600">{step}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Select Bank */}
            {activeStep === 0 && (
              <div>
                <label className="block text-slate-700 mb-2" htmlFor="withdrawal-bank-select">
                  Select bank
                </label>
                {bankLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-slate-600">Loading banks...</span>
                  </div>
                ) : (
                  <select
                    id="withdrawal-bank-select"
                    className="block text-slate-700 mb-2 w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedBank}
                    onChange={(e) => {
                      const name = e.target.value;
                      const bankObj = banks.find((b) => b.name === name);
                      setSelectedBank(name);
                      setSelectedBankCode(bankObj?.code || '');
                      setActiveStep(1);
                    }}
                  >
                    <option value="">Select your bank</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 2: Account Details */}
            {activeStep === 1 && (
              <div>
                <label className="block text-slate-700 mb-2">Account number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  className="block text-slate-700 w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit account number"
                />
                <button
                  onClick={handleVerifyAccount}
                  disabled={loading || accountNumber.length !== 10}
                  className="flex items-center justify-center gap-2 bg-[#0b1437] hover:bg-[#162056] text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  Verify account
                </button>

                {verificationStatus === 'success' && (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 p-4 rounded-md mt-4">
                    <CheckCircle size={18} />
                    <div className="flex-1">
                      <p>Account verified: {accountName}</p>
                    </div>
                    <button
                      onClick={() => setActiveStep(2)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {verificationStatus === 'error' && (
                  <div className="flex items-center gap-2 bg-red-100 text-red-800 p-4 rounded-md mt-4">
                    <AlertCircle size={18} />
                    <p>Invalid account number. Please check and try again.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Verify OTP */}
            {activeStep === 2 && (
              <div className="text-center">
                <label className="block text-slate-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  className="block text-slate-700 w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to your email"
                />

                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-[#0b1437] hover:bg-[#162056] text-white px-4 py-2 rounded-lg transition disabled:opacity-50 mx-auto"
                    title="Send OTP"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    Send OTP
                  </button>
                ) : (
                  <button
                    onClick={handleSetBank}
                    disabled={loading || !otp}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:bg-green-400 mx-auto"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Verify &amp; set bank
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white shadow-lg rounded-lg overflow-hidden z-50">
          <div
            className={`px-4 py-3 flex items-center gap-2 text-white ${snackbar.severity === 'success'
                ? 'bg-green-600'
                : snackbar.severity === 'error'
                  ? 'bg-red-600'
                  : snackbar.severity === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
              }`}
          >
            {snackbar.severity === 'success' ? (
              <CheckCircle size={18} />
            ) : snackbar.severity === 'error' || snackbar.severity === 'warning' ? (
              <AlertCircle size={18} />
            ) : (
              <Info size={18} />
            )}
            <p className="flex-1 text-sm">{snackbar.message}</p>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="text-white hover:text-gray-200"
              title="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SWithdrawalPage;