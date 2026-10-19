// src/pages/School/ViewStudentTransactions.tsx
import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Snackbar } from '../../components/shared/Snackbar';
import { useViewStudentTransactions } from '../../hooks/useViewStudentTransactions';
import StudentHeader from '../../components/student/StudentHeader';
import TransactionSummaryCards from '../../components/student/TransactionSummaryCards';
import TransactionList from '../../components/student/TransactionList';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ViewStudentTransactions: React.FC = () => {
  const {
    student,
    bills,
    loading,
    loadingFees,
    error,
    summary,
    snackbar,
    closeSnackbar,
  } = useViewStudentTransactions();

  if (loading) {
    return <LoadingScreen message="Loading student transactions..." />;
  }

  if (error && !student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header PsettingsPage="/settings" />
          <div className="flex flex-grow overflow-hidden">
            <Sidebar />
            <div className="flex-grow md:ml-64 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
                <div className="flex flex-col items-center justify-center py-16">
                  <DocumentTextIcon className="h-16 w-16 text-red-300 mb-4" />
                  <p className="text-gray-500 text-lg">Student not found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Please check the student ID and try again
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex items-center m-5 mb-6 sm:mb-8">
              <Link
                to="/school/stores"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-indigo-600">
              Student Transactions
            </h1>
            <p className="text-center text-gray-600 mb-8">
              View and manage student fee transactions
            </p>

            {loadingFees && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            )}

            {student && !loadingFees && (
              <>
                <StudentHeader student={student} />
                <TransactionSummaryCards
                  summary={summary}
                  transactionCount={bills.length}
                />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {student.name || `${student.firstName} ${student.lastName}`.trim()}'s Transactions
                </h2>
                <hr className="mb-6" />
                <TransactionList
                  bills={bills}
                  studentName={student.name || `${student.firstName} ${student.lastName}`.trim()}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        position="bottom-right"
      />
    </div>
  );
};

export default ViewStudentTransactions;