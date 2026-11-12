import React from 'react';
import { Search } from 'lucide-react';

interface AgentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AgentSearchBar: React.FC<AgentSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search by name, email or phone',
}) => (
  <div className="relative w-full sm:max-w-xl sm:flex-1">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      aria-label="Search agents"
      className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default AgentSearchBar;