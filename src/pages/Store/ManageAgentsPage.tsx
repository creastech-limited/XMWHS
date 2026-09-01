// src/pages/Store/ManageAgentsPage.tsx
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus as AddIcon, X } from 'lucide-react';
import StoreHeader from '../../components/StoreHeader';
import StoreSidebar from '../../components/StoreSidebar';
import Footer from '../../components/Footer';
import { useManageAgents } from '../../hooks/useManageAgents';
import {
  AgentForm,
  AgentCard,
  AgentEmptyState,
  AgentSearchBar,
} from '../../components/store';

const ManageAgentsPage: React.FC = () => {
  const {
    agents,
    agentCount,
    storeInfo,
    searchTerm,
    showForm,
    showPassword,
    isLoading,
    isPageLoading,
    agentData,
    errors,
    filteredAgents,
    setSearchTerm,
    setShowForm,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleToggleStatus,
    resetForm,
    getInitials,
    getStoreName,
  } = useManageAgents();

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <StoreHeader />
      <div className="z-100">
        <StoreSidebar />
      </div>

      <div className="flex-1 pl-0 md:pl-[250px] transition-all duration-300">
        <div className="h-[80px] xs:h-[90px] sm:h-[100px] md:h-[110px] lg:h-[120px] xl:h-[140px]" />

        <div className="px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-5 sm:py-6 md:py-7 lg:py-8 max-w-6xl mx-auto w-full mb-20">
          {/* Title Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 sm:mb-6 md:mb-7 gap-3 sm:gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-xl xs:text-2xl sm:text-[26px] md:text-[28px] lg:text-3xl font-bold text-gray-800">
                Manage Agents
              </h1>
              <p className="text-xs xs:text-sm sm:text-[13px] md:text-[14px] text-gray-500 mt-1">
                {getStoreName()} • Total Agents: {agentCount}
              </p>
              {storeInfo && (
                <p className="text-[11px] xs:text-xs sm:text-[13px] text-gray-400 mt-1 truncate">
                  Store Type: {storeInfo.type} • Store ID: {storeInfo.store_id}
                </p>
              )}
            </div>

            <div className="w-full md:w-[200px]">
              <button
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md w-full ${
                  showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors text-sm sm:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => setShowForm(!showForm)}
                disabled={!storeInfo?.store_id}
              >
                {showForm ? (
                  <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                ) : (
                  <AddIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                )}
                {showForm ? "Cancel" : "Add New Agent"}
              </button>
            </div>
          </div>

          {/* Agent Creation Form */}
          <AgentForm
            isOpen={showForm}
            formData={agentData}
            errors={errors}
            isLoading={isLoading}
            showPassword={showPassword}
            onClose={resetForm}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Search Bar */}
          <AgentSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
          />

          {/* Loading State */}
          {isPageLoading && (
            <div className="flex justify-center my-6 sm:my-7 md:my-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Agents List or Empty State */}
          {!isPageLoading && agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  storeInfo={storeInfo}
                  onToggleStatus={handleToggleStatus}
                  getInitials={getInitials}
                />
              ))}
            </div>
          ) : !isPageLoading ? (
            <AgentEmptyState
              searchTerm={searchTerm}
              hasStoreId={!!storeInfo?.store_id}
              onAddAgent={() => setShowForm(true)}
            />
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default ManageAgentsPage;