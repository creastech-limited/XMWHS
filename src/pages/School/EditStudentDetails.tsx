// src/pages/School/EditStudentDetails.tsx
import React from 'react';
import { ArrowLeft, UsersIcon } from 'lucide-react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { ErrorDisplay } from '../../components/shared/ErrorDisplay';
import { useEditStudent } from '../../hooks/useEditStudent';
import StudentEditForm from '../../components/student/StudentEditForm';
import { Link } from 'react-router-dom';

const EditStudentDetails: React.FC = () => {
  const {
    user,
    profile,
    fetchLoading,
    isLoading,
    error,
    // Remove _id from destructuring since it's not used
    handleProfileChange,
    handleProfileUpdate,
    handleRetry,
  } = useEditStudent();

  if (fetchLoading) {
    return <LoadingScreen message="Loading student data..." />;
  }

  if (error && !user) {
    return (
      <ErrorDisplay
        title="Error Loading Student Data"
        message={error}
        onRetry={error.includes('Session expired') || error.includes('Authentication required')
          ? undefined
          : handleRetry}
        onLogin={error.includes('Session expired') || error.includes('Authentication required')
          ? () => window.location.href = '/login'
          : undefined}
      />
    );
  }

  return (
    <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />

      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
          <div className="p-4 md:p-6">
            <div className="bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
              <div className="max-w-full">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center m-5 mb-6 sm:mb-8">
                    <Link
                      to="/students"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors group"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      Back
                    </Link>
                  </div>
                  <div className="flex items-center m-5 mb-6 sm:mb-8">
                    <UsersIcon className="h-7 w-7 text-indigo-600 mr-2" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900">
                      {user ? `${user.name}'s Details` : 'Student Details'}
                    </h1>
                  </div>

                  {error && (
                    <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {user ? (
                    <div className="px-5 pb-8">
                      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h2 className="text-lg font-semibold text-gray-800">Student Information</h2>
                        <p className="mt-2 text-gray-600">Name: {user.name}</p>
                      </div>
                      <StudentEditForm
                        profile={profile}
                        isLoading={isLoading}
                        onProfileChange={handleProfileChange}
                        onSubmit={handleProfileUpdate}
                        onCancel={() => window.history.back()}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-500">No student data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditStudentDetails;