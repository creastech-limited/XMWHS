// src/components/student/StudentRegistrationLink.tsx
import React from 'react';
import { MailIcon, ClipboardCopyIcon } from 'lucide-react';

interface StudentRegistrationLinkProps {
  link: string;
  onCopy: () => void;
}

const StudentRegistrationLink: React.FC<StudentRegistrationLinkProps> = ({
  link,
  onCopy,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <MailIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Student Registration Link
          </h2>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 w-full">
        <div className="flex-1 relative">
          <input
            readOnly
            value={link}
            placeholder="Generating registration link..."
            title="Student registration link"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:outline-none font-medium"
          />
        </div>
        <button
          onClick={onCopy}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title="Copy registration link"
          aria-label="Copy registration link"
        >
          <ClipboardCopyIcon className="text-indigo-500 h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  );
};

export default StudentRegistrationLink;