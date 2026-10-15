import { LogOut } from 'lucide-react';
import React from 'react';

interface ConfirmLogoutModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
    open,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6  shadow-2xl">
                <h2 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <span className="text-[#FC424B]">
                        <LogOut size={24} />
                    </span>
                    Log out?</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border !border-black py-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        No
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-indigo-900 py-2.5 text-white hover:bg-indigo-700 transition-colors"
                    >
                        Yes, log out
                    </button>
                </div>
            </div>
        </div>
    );
};