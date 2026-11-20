import SettingsPanel from "../../components/SettingsPanel";

const StoreSettingsPage = () => {
  return (
    <>
      {/* Main Content */}
        <div>
          <div className=" p-4 sm:p-6 md:p-8">
            <div className="space-y-6 mb-16">
              <SettingsPanel showAcademicCalendar={false} />
            </div>
          </div>
        </div>

    </>
  );
};

export default StoreSettingsPage;