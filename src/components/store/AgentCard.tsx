// src/components/store/AgentCard.tsx
import React from 'react';
import type { StoreAgent } from '../../types';

interface AgentCardProps {
  agent: StoreAgent;
  storeInfo: { schoolId?: string } | null;
  onToggleStatus: (agent: StoreAgent) => void;
  getInitials: (firstName: string, lastName: string) => string;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  storeInfo,
  onToggleStatus,
  getInitials,
}) => {
  const isActive = agent.status !== 'inactive';
  const isStandalone = agent.isStandAlone || agent.schoolId === 'FFZ960384' || storeInfo?.schoolId === 'FFZ960384';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start mb-4 sm:mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${isActive ? 'bg-blue-600' : 'bg-gray-400'}`}>
              {getInitials(agent.firstName, agent.lastName)}
            </div>
            <div className="max-w-[140px] sm:max-w-[160px]">
              <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                {agent.fullName || `${agent.firstName} ${agent.lastName}`}
              </h3>
              <p className="text-sm text-gray-500 capitalize truncate">
                {agent.role}
              </p>
              {isStandalone && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  Standalone
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onToggleStatus(agent)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isActive ? 'bg-green-500 focus:ring-green-500' : 'bg-red-500 focus:ring-red-500'
            }`}
            aria-label={isActive ? 'Deactivate agent' : 'Activate agent'}
            title={isActive ? 'Click to deactivate' : 'Click to activate'}
          >
            <span className={`absolute text-[10px] font-bold text-white transition-opacity duration-300 ${
              isActive ? 'left-2 opacity-100' : 'left-2 opacity-0'
            }`}>
              ON
            </span>
            <span className={`absolute text-[10px] font-bold text-white transition-opacity duration-300 ${
              !isActive ? 'right-2 opacity-100' : 'right-2 opacity-0'
            }`}>
              OFF
            </span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                isActive ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-gray-200 my-2 sm:my-3 md:my-4" />

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
            <span className="font-medium w-16 sm:w-20">Email:</span>
            <span className="text-gray-600 truncate">{agent.email || 'N/A'}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
            <span className="font-medium w-16 sm:w-20">Phone:</span>
            <span className="text-gray-600 truncate">{agent.phone || 'N/A'}</span>
          </div>
          {agent.schoolId && (
            <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
              <span className="font-medium w-16 sm:w-20">School ID:</span>
              <span className="text-gray-600 text-xs truncate">{agent.schoolId}</span>
            </div>
          )}
          <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
            <span className="font-medium w-16 sm:w-20">Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'text-green-700 bg-green-100 border border-green-200'
                : 'text-red-700 bg-red-100 border border-red-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;