import React from 'react';
import { Link } from 'react-router-dom';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
    className = '',
    children,
}) => (
    <section className={`rounded-xl border border-slate-200 bg-white ${className}`}>
        {children}
    </section>
);

export const CardHeader: React.FC<{
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionTo?: string;
    onAction?: () => void;
}> = ({ title, subtitle, actionLabel, actionTo, onAction }) => {
    const actionClass =
        'text-xs font-medium text-slate-900 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded';
    return (
        <header className="flex items-start justify-between px-5 pt-4 pb-3">
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {actionLabel && actionTo && (
                <Link to={actionTo} className={actionClass}>
                    {actionLabel}
                </Link>
            )}
            {actionLabel && !actionTo && onAction && (
                <button onClick={onAction} className={actionClass}>
                    {actionLabel}
                </button>
            )}
        </header>
    );
};

const STATUS_STYLES: Record<string, string> = {
    Completed: 'bg-emerald-50 text-emerald-700',
    Pending: 'bg-amber-50 text-amber-700',
    Failed: 'bg-red-50 text-red-700',
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-600',
};
const STATUS_DOT: Record<string, string> = {
    Completed: 'bg-emerald-500',
    Pending: 'bg-amber-500',
    Failed: 'bg-red-500',
    Active: 'bg-emerald-500',
    Inactive: 'bg-slate-400',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'
            }`}
    >
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-slate-400'}`} />
        {status}
    </span>
);

const AVATAR_COLORS = [
    'bg-indigo-600',
    'bg-teal-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-sky-600',
    'bg-violet-600',
];

// Colour is derived from the name so an agent keeps the same colour everywhere.
export const AgentAvatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({
    name,
    size = 'md',
}) => {
    const initials = name
        .replace(/@.*/, '')
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
    const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    return (
        <span
            aria-hidden="true"
            className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white ${AVATAR_COLORS[hash % AVATAR_COLORS.length]
                } ${size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'}`}
        >
            {initials || '?'}
        </span>
    );
};

export const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export const Switch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={onChange}
        style={{
            width: 52,
            height: 28,
            borderRadius: 9999,
            backgroundColor: checked ? '#0f1b4c' : '#dde1ee',
        }}
        className="relative inline-block shrink-0 cursor-pointer border-0 p-0 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1b4c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
        <span
            style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 22,
                height: 22,
                borderRadius: 9999,
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: checked ? 'translateX(24px)' : 'translateX(0)',
                transition: 'transform 300ms ease',
            }}
        />
    </button>
);