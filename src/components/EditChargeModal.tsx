import { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { Charge } from '../types';
import type { UpdateChargePayload } from '../services/api/userService';

interface EditChargeModalProps {
    charge: Charge | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, payload: UpdateChargePayload) => Promise<void>;
}

const toStr = (v: unknown) =>
    v === undefined || v === null || v === '' ? '' : String(v);

const show = (v: unknown) => (toStr(v) === '' ? '—' : toStr(v));

const EditChargeModal = ({ charge, isOpen, onClose, onSave }: EditChargeModalProps) => {
    const [name, setName] = useState('');
    const [chargeType, setChargeType] = useState<'Flat' | 'Percentage'>('Flat');
    const [amount, setAmount] = useState('');
    const [amount2, setAmount2] = useState('');
    const [amount3, setAmount3] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<UpdateChargePayload | null>(null);

    // Pre-fill the form every time a different charge is opened
    useEffect(() => {
        if (charge && isOpen) {
            setName(toStr(charge.name));
            setChargeType(charge.chargeType === 'Percentage' ? 'Percentage' : 'Flat');
            setAmount(toStr(charge.amount));
            setAmount2(toStr(charge.amount2));
            setAmount3(toStr(charge.amount3));
            setDescription(toStr(charge.description));
            setError('');
            setConfirming(false);
            setPendingPayload(null);
        }
    }, [charge, isOpen]);

    // Escape steps back from confirmation first, then closes the modal
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || saving) return;
            if (confirming) setConfirming(false);
            else onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, saving, confirming, onClose]);

    if (!isOpen || !charge) return null;

    const isPercentage = chargeType === 'Percentage';
    const suffix = isPercentage ? '%' : '₦';

    // Step 1: validate, then show the confirmation panel
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('Charge name is required.');
        if (amount === '' || Number(amount) < 0 || Number.isNaN(Number(amount))) {
            return setError(
                isPercentage ? 'Enter a valid percentage for Tier 1.' : 'Enter a valid amount.'
            );
        }
        if (isPercentage) {
            for (const v of [amount, amount2, amount3]) {
                if (v !== '' && Number(v) > 100) return setError('Percentages cannot be more than 100.');
            }
        }

        const payload: UpdateChargePayload = {
            name: name.trim(),
            chargeType,
            amount: Number(amount),
            description: description.trim(),
        };
        // Tier 2 and 3 only apply to percentage charges
        if (isPercentage) {
            if (amount2 !== '') payload.amount2 = Number(amount2);
            if (amount3 !== '') payload.amount3 = Number(amount3);
        }

        setPendingPayload(payload);
        setConfirming(true);
    };

    // Step 2: the person said yes, send the request
    const handleConfirm = async () => {
        if (!pendingPayload) return;
        try {
            setSaving(true);
            setError('');
            await onSave(String(charge._id), pendingPayload);
            onClose();
        } catch (err) {
            setError((err as Error)?.message || 'Could not update the charge. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // What actually changed, shown in the confirmation panel
    const changes: [string, string, string][] = pendingPayload
        ? (
            [
                ['Name', show(charge.name), show(pendingPayload.name)],
                ['Type', show(charge.chargeType), show(pendingPayload.chargeType)],
                ['Amount', show(charge.amount), show(pendingPayload.amount)],
                ['Tier 2', show(charge.amount2), show(pendingPayload.amount2)],
                ['Tier 3', show(charge.amount3), show(pendingPayload.amount3)],
                ['Description', show(charge.description), show(pendingPayload.description)],
            ] as [string, string, string][]
        ).filter(([, before, after]) => before !== after)
        : [];

    const inputClass =
        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white disabled:bg-gray-100';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

    const errorBanner = error ? (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
        </div>
    ) : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-charge-title"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 id="edit-charge-title" className="text-lg font-semibold text-gray-900">
                        {confirming ? 'Confirm changes' : 'Edit charge'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {confirming ? (
                    <div className="px-6 py-5 space-y-4">
                        {errorBanner}

                        <p className="text-gray-800">
                            Are you sure you want to update{' '}
                            <span className="font-semibold">{charge.name}</span>? This changes what users are
                            charged on future transactions.
                        </p>

                        {changes.length > 0 ? (
                            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg text-sm">
                                {changes.map(([label, before, after]) => (
                                    <li key={label} className="flex items-center justify-between gap-4 px-3 py-2">
                                        <span className="text-gray-500">{label}</span>
                                        <span className="text-gray-900 text-right">
                                            <span className="line-through text-gray-400">{before}</span>
                                            {'  '}→{'  '}
                                            <span className="font-semibold">{after}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">You haven't changed any values.</p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirming(false);
                                    setError('');
                                }}
                                disabled={saving}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                No, go back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {saving ? 'Updating...' : 'Yes, update charge'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        {errorBanner}

                        <div>
                            <label className={labelClass} htmlFor="charge-name">Charge name</label>
                            <input
                                id="charge-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="charge-type">Charge type</label>
                            <select
                                id="charge-type"
                                value={chargeType}
                                onChange={(e) => setChargeType(e.target.value as 'Flat' | 'Percentage')}
                                className={inputClass}
                            >
                                <option value="Flat">Flat</option>
                                <option value="Percentage">Percentage</option>
                            </select>
                        </div>

                        <div className={isPercentage ? 'grid grid-cols-1 sm:grid-cols-3 gap-3' : ''}>
                            <div>
                                <label className={labelClass} htmlFor="charge-amount">
                                    {isPercentage ? 'Tier 1 (%)' : 'Amount (₦)'}
                                </label>
                                <div className="relative">
                                    <input
                                        id="charge-amount"
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`${inputClass} pr-8`}
                                    />
                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">{suffix}</span>
                                </div>
                            </div>

                            {isPercentage && (
                                <>
                                    <div>
                                        <label className={labelClass} htmlFor="charge-amount2">Tier 2 (%)</label>
                                        <div className="relative">
                                            <input
                                                id="charge-amount2"
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={amount2}
                                                onChange={(e) => setAmount2(e.target.value)}
                                                className={`${inputClass} pr-8`}
                                            />
                                            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="charge-amount3">Tier 3 (%)</label>
                                        <div className="relative">
                                            <input
                                                id="charge-amount3"
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={amount3}
                                                onChange={(e) => setAmount3(e.target.value)}
                                                className={`${inputClass} pr-8`}
                                            />
                                            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="charge-description">Description</label>
                            <textarea
                                id="charge-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditChargeModal;