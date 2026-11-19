import React, { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';

interface SlideOverProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    /** Pinned bar at the bottom (buttons). */
    footer?: React.ReactNode;
    widthClassName?: string;
}

const TRANSITION_MS = 300;

export const SlideOver: React.FC<SlideOverProps> = ({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    widthClassName = 'max-w-[420px]',
}) => {
    // `mounted` keeps the panel in the DOM while it slides out
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // next frame so the browser registers the starting (off-screen) position
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setVisible(false);
        const t = setTimeout(() => setMounted(false), TRANSITION_MS);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Panel */}
            <aside
                className={`absolute right-0 top-0 flex h-full w-full ${widthClassName} flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

                {footer && (
                    <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                        {footer}
                    </footer>
                )}
            </aside>
        </div>
    );
};

export default SlideOver;