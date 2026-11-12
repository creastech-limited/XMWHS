import SettingsPanel from '../../components/SettingsPanel';

const SettingsPage = () => {
  return (
    <main className="flex-1 p-4 md:p-6 overflow-x-auto">
      <div className="flex-grow md:ml-64">
        <div className="p-4 md:p-6">
          <SettingsPanel />
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;