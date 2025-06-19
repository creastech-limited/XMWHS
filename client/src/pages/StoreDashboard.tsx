import React, { useState } from 'react';
import { 
  TrendingUp, 
  MoreVertical, 
  RefreshCw, 
  Wallet, 
  Users, 
  DollarSign, 
  Bell,
  UserPlus,
  Plus,
  FileDown,
  Activity
} from 'lucide-react';
import StoreSidebar from '../components/StoreSidebar';
import StoreHeader from '../components/StoreHeader';
import Footer from '../components/Footer';

// Define TypeScript interfaces
interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  customer: string;
}

interface Agent {
  name: string;
  sales: number;
  performance: number;
  revenue: number;
}

interface DashboardData {
  walletBalance: number;
  dailyRevenue: number;
  numberOfAgents: number;
  growth: {
    revenue: number;
    agents: number;
  };
  recentTransactions: Transaction[];
  topAgents: Agent[];
}

const StoreDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Enhanced analytics data
  const data: DashboardData = {
    walletBalance: 500000,
    dailyRevenue: 75000,
    numberOfAgents: 25,
    growth: {
      revenue: 8.5,
      agents: 12,
    },
    recentTransactions: [
      { id: 'TX78943', date: '28 Feb 2025', amount: 12500, status: 'Completed', customer: 'John Doe' },
      { id: 'TX78944', date: '27 Feb 2025', amount: 8750, status: 'Pending', customer: 'Sarah Johnson' },
      { id: 'TX78945', date: '27 Feb 2025', amount: 5000, status: 'Completed', customer: 'Michael Scott' },
      { id: 'TX78946', date: '26 Feb 2025', amount: 15250, status: 'Failed', customer: 'Emma Thompson' },
      { id: 'TX78947', date: '25 Feb 2025', amount: 9800, status: 'Completed', customer: 'David Wilson' },
    ],
    topAgents: [
      { name: 'Alice Cooper', sales: 58, performance: 94, revenue: 245000 },
      { name: 'Bob Smith', sales: 45, performance: 87, revenue: 180000 },
      { name: 'Claire Davis', sales: 42, performance: 91, revenue: 168000 },
      { name: 'Daniel Jones', sales: 38, performance: 82, revenue: 152000 },
    ]
  };

  // Get status badge component
  const getStatusBadge = (status: Transaction['status']) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch(status) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'Pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'Failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  // Get performance bar color
  const getPerformanceColor = (performance: number): string => {
    if (performance >= 90) return 'bg-green-500';
    if (performance >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
            {/* Header and Sidebar */}
            <StoreHeader />
            <StoreSidebar />
        

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8 md:ml-64 mt-16 md:mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Wallet Balance</p>
                  <p className="text-3xl font-bold mt-2">₦{data.walletBalance.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Daily Revenue */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Daily Revenue</p>
                  <p className="text-3xl font-bold mt-2">₦{data.dailyRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{data.growth.revenue}%</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Number of Agents */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Number of Agents</p>
                  <p className="text-3xl font-bold mt-2">{data.numberOfAgents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{data.growth.agents}%</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Refresh Transactions"
                        title="Refresh Transactions"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="More Options"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{transaction.id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{transaction.customer}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{transaction.date}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(transaction.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 border-t border-gray-200 text-center">
                    <a 
                    href="/stransactions" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                    <span className="text-white">View All Transactions</span>
                    </a>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">4 New</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Wallet balance alert</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New agent request from John Smith</p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Monthly sales report is available</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 text-center">
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 0
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Top Agents
                  </button>
                  <button
                    onClick={() => setActiveTab(1)}
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
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Agent Name</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Sales</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Performance</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.topAgents.map((agent) => (
                          <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4">
                              <span className="font-medium text-gray-900">{agent.name}</span>
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
                                <span className="text-sm text-gray-700 min-w-12">{agent.performance}%</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <span className="font-medium text-gray-900">₦{agent.revenue.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 1 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Transaction ID</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.recentTransactions
                          .filter(transaction => transaction.status === 'Pending')
                          .map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4">
                                <span className="font-medium text-gray-900">{transaction.id}</span>
                              </td>
                              <td className="py-4">
                                <span className="text-gray-700">{transaction.customer}</span>
                              </td>
                              <td className="py-4">
                                <span className="text-gray-600">{transaction.date}</span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</span>
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
                          ))}
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
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group">
                  <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Add Agent</span>
                </button>
                
                <button className="flex flex-col items-center p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 group">
                  <Plus className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Add Funds</span>
                </button>
                
                <button className="flex flex-col items-center p-6 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 group">
                  <FileDown className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Export Data</span>
                </button>
                
                <button className="flex flex-col items-center p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group">
                  <Bell className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Notifications</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
  
  );
};

export default StoreDashboard;