// src/components/store/StorePerformanceTab.tsx
import React from 'react';
import type { Agent, Transaction } from '../../types';

interface StorePerformanceTabProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  topAgents: Agent[];
  pendingTransactions: Transaction[];
}

const StorePerformanceTab: React.FC<StorePerformanceTabProps> = ({
  activeTab,
  onTabChange,
  topAgents,
  pendingTransactions,
}) => {
  const getPerformanceColor = (performance: number): string => {
    if (performance >= 90) return 'bg-green-500';
    if (performance >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            Pending
          </span>
        );
      case 'Failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            Failed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => onTabChange(0)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 0
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Top Agents
          </button>
          <button
            onClick={() => onTabChange(1)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 1
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Transactions
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">
                    Agent Name
                  </th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">
                    Sales
                  </th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">
                    Performance
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topAgents.length > 0 ? (
                  topAgents.map((agent) => (
                    <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <span className="font-medium text-gray-900">
                          {agent.name}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-gray-700">{agent.sales}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                            <div
                              className={`h-2 rounded-full ${getPerformanceColor(agent.performance)}`}
                              style={{ width: `${agent.performance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700 min-w-12">
                            {agent.performance}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-medium text-gray-900">
                          ₦{agent.revenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No agent data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 1 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">
                    Transaction ID
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">
                    Amount
                  </th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingTransactions.length > 0 ? (
                  pendingTransactions.map((transaction) => (
                    <tr key={String(transaction.id)} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <span className="font-medium text-gray-900">
                          {String(transaction.id)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-gray-700">{transaction.customer}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-gray-600">{transaction.date}</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-medium text-gray-900">
                          ₦{transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-4 text-center">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          Process
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No pending transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorePerformanceTab;