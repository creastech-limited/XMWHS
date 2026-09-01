// src/components/store/AgentEmptyState.tsx
import React from 'react';
import { CircleHelp, Plus } from 'lucide-react';

interface AgentEmptyStateProps {
  searchTerm: string;
  hasStoreId: boolean;
  onAddAgent: () => void;
}

const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  searchTerm,
  hasStoreId,
  onAddAgent,
}) => {
  return (
    <div className="bg-white p-6 sm:p-7 md:p-7 lg:p-8 text-center rounded-xl shadow-sm max-w-2xl mx-auto">
      <div className="mx-auto h-32 w-32 sm:h-36 sm:w-36 bg-gray-100 rounded-full flex items-center justify-center mb-5 sm:mb-6">
        <CircleHelp className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
      </div>
      <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-gray-900 mb-2 sm:mb-3">
        No Agents Found
      </h3>
      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-5">
        {searchTerm
          ? `No agents match your search "${searchTerm}". Try adjusting your search terms.`
          : 'Get started by adding your first agent to help manage your store.'
        }
      </p>
      {!searchTerm && hasStoreId && (
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
          onClick={onAddAgent}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Add Your First Agent
        </button>
      )}
      {!hasStoreId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Store information is still loading. Please wait or refresh the page if this persists.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentEmptyState;