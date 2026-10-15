// src/pages/School/StudentPage.tsx
import React from 'react';
import { PlusIcon, UsersIcon } from 'lucide-react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useStudentManagement } from '../../hooks/useStudentManagement';
import { Snackbar } from '../../components/shared/Snackbar';
import {
  StudentStatsCards,
  StudentRegistrationLink,
  StudentFilters,
  StudentTable,
  StudentActionsMenu,
  GuardianModal,
  PinModal,
  BulkUploadModal,
} from '../../components/student';

const StudentPage: React.FC = () => {
  const {
    // Data - only use what's needed
    loading,
    stats,
    paginatedStudents,
    pageCount,
    availableClasses,
    registrationLink,
    // Filters & Pagination
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    totalFiltered,
    // UI State
    menuStudent,
    isMenuOpen,
    menuPosition,
    // Modals
    isGuardianModalOpen,
    setIsGuardianModalOpen,
    guardianEmail,
    setGuardianEmail,
    availableParents,
    guardianLoading,
    selectedStudent,
    isBulkUploadOpen,
    setIsBulkUploadOpen,
    selectedFile,
    setSelectedFile,
    bulkUploadLoading,
    uploadProgress,
    isPinModalOpen,
    setIsPinModalOpen,
    pinAction,
    setPinAction,
    pinData,
    setPinData,
    pinLoading,
    // Handlers
    getStudentDisplayName,
    getStudentInitials,
    getStudentProfileImage,
    handleCopyLink,
    handleMenuOpen,
    handleMenuClose,
    handleGuardianClick,
    handleViewDetails,
    handleViewTransactions,
    handleActivateDeactivate,
    handleUpdateGuardian,
    handleBulkUpload,
    handleDownloadSample,
    handleExport,
    handleSetPin,
    handleUpdatePin,
    // Snackbar
    snackbar,
    setSnackbar,
  } = useStudentManagement();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header PsettingsPage="/settings" />
        <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
            <Sidebar />
          </aside>
          <main className="flex-grow p-4 md:p-8 md:ml-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />

      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>

        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              <UsersIcon className="h-7 w-7 text-indigo-600" />
              <span className="text-indigo-900">Student Management</span>
            </h1>
            <button
              onClick={() => {
                if (registrationLink) {
                  window.location.href = registrationLink;
                }
              }}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Student</span>
            </button>
          </div>

          {/* Stats Cards */}
          <StudentStatsCards stats={stats} />

          {/* Registration Link */}
          <StudentRegistrationLink
            link={registrationLink}
            onCopy={handleCopyLink}
          />

          {/* Filters */}
          <StudentFilters
            searchQuery={filters.searchQuery}
            onSearchChange={(value) => setFilters({ ...filters, searchQuery: value })}
            statusFilter={filters.statusFilter}
            onStatusFilterChange={(value) => setFilters({ ...filters, statusFilter: value })}
            gradeFilter={filters.gradeFilter}
            onGradeFilterChange={(value) => setFilters({ ...filters, gradeFilter: value })}
            availableClasses={availableClasses}
            onDownloadSample={handleDownloadSample}
            onBulkUpload={() => setIsBulkUploadOpen(true)}
            onExport={handleExport}
          />

          {/* <PageSizeSelector
            pageSize={pageSize}
            total={totalFiltered}
            page={page}
            onChange={handlePageSizeChange}
          /> */}

          {/* Student Table */}
          <StudentTable
            students={paginatedStudents}
            loading={loading}
            pageCount={pageCount}
            currentPage={page}
            onPageChange={setPage}
            onMenuOpen={handleMenuOpen}
            getStudentDisplayName={getStudentDisplayName}
            getStudentInitials={getStudentInitials}
            getStudentProfileImage={getStudentProfileImage}
            pageSize={pageSize}
            totalItems={totalFiltered}
            onPageSizeChange={handlePageSizeChange}
          />
        </main>
      </div>

      <Footer />

      {/* Modals */}
      <StudentActionsMenu
        isOpen={isMenuOpen}
        student={menuStudent}
        position={menuPosition}
        onClose={handleMenuClose}
        onViewDetails={handleViewDetails}
        onViewTransactions={handleViewTransactions}
        onAssignGuardian={handleGuardianClick}
        onActivateDeactivate={handleActivateDeactivate}
        onSetPin={() => { setPinAction('set'); setIsPinModalOpen(true); }}
        onUpdatePin={() => { setPinAction('update'); setIsPinModalOpen(true); }}
      />

      <GuardianModal
        isOpen={isGuardianModalOpen}
        student={selectedStudent}
        parents={availableParents}
        selectedEmail={guardianEmail}
        loading={guardianLoading}
        onEmailChange={setGuardianEmail}
        onAssign={handleUpdateGuardian}
        onClose={() => setIsGuardianModalOpen(false)}
      />

      <PinModal
        isOpen={isPinModalOpen}
        action={pinAction}
        student={menuStudent}
        pinData={pinData}
        loading={pinLoading}
        onPinChange={setPinData}
        onSubmit={() => pinAction === 'set' ? handleSetPin() : handleUpdatePin()}
        onClose={() => setIsPinModalOpen(false)}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        file={selectedFile}
        loading={bulkUploadLoading}
        progress={uploadProgress}
        onFileChange={setSelectedFile}
        onUpload={handleBulkUpload}
        onDownloadSample={handleDownloadSample}
        onClose={() => setIsBulkUploadOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        position="bottom-right"
      />
    </div>
  );
};

export default StudentPage;