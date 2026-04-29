import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SecurityHeader from '../../components/SecurityHeader';
import SecuritySidebar from '../../components/SecuritySidebar';
import Footer from '../../components/Footer';
import { getUserDetails } from '../../services';
import type { User as AppUser, UserResponse } from '../../types/user';

const SecurityDashboard: React.FC = () => {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data: UserResponse = await getUserDetails();
      const userProfile = data.user?.data || data.user || data.data || data;

      if (!userProfile || typeof userProfile !== 'object') {
        throw new Error('Invalid security profile data');
      }

      setProfile(userProfile as AppUser);
    } catch (err) {
      console.error('Failed to load security profile', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName =
    profile?.name ||
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
    'Security User';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700">
      <SecurityHeader />
      <div className="z-100">
        <SecuritySidebar />
      </div>

      <main className="min-w-0 flex-1 p-4 lg:ml-[280px] lg:p-8 transition-all duration-300">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">Loading security dashboard...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-7 w-7 text-blue-600" />
                  <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Your account overview is available here, with quick access to the tools you need most.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
                <CheckCircle2 className="h-4 w-4" />
                {profile?.status || 'Active'}
              </div>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 py-7 text-white sm:px-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="max-w-2xl">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                      Security Portal
                    </p>
                    <h2 className="text-2xl font-bold sm:text-3xl">{displayName}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
                      Welcome back. This dashboard is focused on your own profile, status, and account details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[460px]">
                    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                      <div className="mb-2 flex items-center gap-2 text-blue-100">
                        <User className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Name</span>
                      </div>
                      <p className="text-sm font-semibold text-white sm:text-base">{displayName}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                      <div className="mb-2 flex items-center gap-2 text-blue-100">
                        <Mail className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Email</span>
                      </div>
                      <p className="break-all text-sm font-semibold text-white">{profile?.email || 'N/A'}</p>
                    </div>

                    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                      <div className="mb-2 flex items-center gap-2 text-blue-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Status</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{profile?.status || 'Active'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">Account Snapshot</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Security Name</span>
                    </div>
                    <p className="font-semibold text-slate-900">{displayName}</p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="break-all font-semibold text-slate-900">{profile?.email || 'N/A'}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <p className="font-semibold text-slate-900">{profile?.phone || 'N/A'}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">School</span>
                    </div>
                    <p className="font-semibold text-slate-900">{profile?.schoolName || 'N/A'}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">Quick Access</h3>

                <Link
                  to="/security/settings"
                  className="group block rounded-2xl border border-blue-100 bg-blue-50 p-5 transition-colors hover:bg-blue-100"
                >
                  <div className="mb-3 inline-flex rounded-2xl bg-white p-3 text-blue-700 shadow-sm">
                    <Settings className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-slate-900">Open Security Settings</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Review your details and manage your account from the settings page.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                    Go to settings
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </section>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SecurityDashboard;
