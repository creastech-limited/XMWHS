import React from 'react';

interface DownloadAppModalProps {
  open: boolean;
  onClose: () => void;
}

const APP_LINKS = {
  appStore: 'https://apps.apple.com/ng/app/xpay-wallet-system/id6802598622',
  playStore: 'https://play.google.com/store/apps/details?id=com.crestech.xpay',
};

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-indigo-900 mb-2">Please use our mobile app</h2>
        <p className="text-gray-600 mb-6">
          Your account is only available on the mobile app. Download it below to continue.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={APP_LINKS.appStore}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-indigo-900 py-2.5 text-white hover:bg-indigo-700 transition-colors"
          >
            Download on the App Store
          </a>
          <a
            href={APP_LINKS.playStore}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-indigo-900 py-2.5 text-white hover:bg-indigo-700 transition-colors"
          >
            Get it on Google Play
          </a>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};