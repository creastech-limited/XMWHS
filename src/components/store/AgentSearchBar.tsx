// src/components/store/AgentSearchBar.tsx
import React from 'react';
import { SearchIcon } from 'lucide-react';

interface AgentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AgentSearchBar: React.FC<AgentSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search agents by name, email, or phone',
}) => {
  return (
    <div className="relative mb-5 sm:mb-6 md:mb-7">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-[18px] w-[18px] text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-[15px] md:text-[15px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default AgentSearchBar;