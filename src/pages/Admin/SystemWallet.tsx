/*import { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  RefreshCw,
  Database,
  Activity,
  EyeOff,
} from 'lucide-react';

import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';

interface SystemWalletEntry {
  id: string;
  label: string;
  amount: string;
  lastUpdated: string;
  status: string;
}

const SystemWallet = () => {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('system-wallet');

  const systemSummary = [
    {
      title: 'System Balance',
      value: '₦0.00',
      description: 'Total value held in the platform wallet',
      icon: Wallet,
      colorClass: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Pending Settlements',
      value: '₦0.00',
      description: 'Transfers awaiting approval or reconciliation',
      icon: Database,
      colorClass: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Fee Reserves',
      value: '₦0.00',
      description: 'Accumulated operational fees reserved by the system',
      icon: ShieldCheck,
      colorClass: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const placeholderEntries: SystemWalletEntry[] = [
    {
      id: 'SYS-001',
      label: 'No data available',
      amount: '₦0.00',
      lastUpdated: 'N/A',
      status: 'Pending',
    },
    {
      id: 'SYS-002',
      label: 'No data available',
      amount: '₦0.00',
      lastUpdated: 'N/A',
      status: 'Pending',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeMenu={activeMenu}
        />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <section className="rounded-3xl bg-white shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold text-gray-900">System Wallet</h1>
                    <p className="text-gray-600 mt-1">Overview of platform wallet activity and reserved funds.</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  API not configured yet
                </button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {systemSummary.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{item.title}</p>
                        <p className="mt-3 text-3xl font-semibold text-gray-900">{item.value}</p>
                      </div>
                      <div className={`${item.colorClass} rounded-2xl p-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">{item.description}</p>
                  </div>
                );
              })}
            </section>

            <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">System wallet activity</h2>
                  <p className="mt-1 text-sm text-gray-500">This section will display the platform ledger once the backend is available.</p>
                </div>
                <div className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 bg-gray-50">
                  <EyeOff className="w-4 h-4 mr-2" />
                  View mode placeholder
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Reference</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Last updated</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {placeholderEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-gray-700">{entry.id}</td>
                        <td className="px-4 py-4 text-gray-700">{entry.label}</td>
                        <td className="px-4 py-4 text-gray-700">{entry.amount}</td>
                        <td className="px-4 py-4 text-gray-700">{entry.lastUpdated}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900">Next steps</h3>
                <p className="mt-3 text-sm text-gray-600">
                  The System Wallet UI is now established. Once the API is available, the page will connect to real system wallet data, reconciliation history, and settlement controls.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Create endpoints for system wallet balance and transaction history.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Add reconciliation actions and settlement workflow.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Show pending fees, reserves, and fund movement details.
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-100">System status</p>
                    <h3 className="mt-3 text-2xl font-semibold">Waiting for backend</h3>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-6 text-blue-100/90">
                  No live system wallet data is available until the API is implemented. The current layout is ready and integrated into the admin dashboard.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemWallet;*/
