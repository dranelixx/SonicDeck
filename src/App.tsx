import { useState } from "react";
import Dashboard from "./components/dashboard/Dashboard";
import Settings from "./components/settings/Settings";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AudioProvider } from "./contexts/AudioContext";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import {
  SoundLibraryProvider,
  useSoundLibrary,
} from "./contexts/SoundLibraryContext";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import UpdateModal from "./components/modals/UpdateModal";

type View = "dashboard" | "settings";

function AppContent() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const { isLoading: settingsLoading } = useSettings();
  const { isLoading: soundsLoading } = useSoundLibrary();
  const updateState = useUpdateCheck();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Dashboard-specific state that persists across view changes
  const [dashboardDevice1, setDashboardDevice1] = useState<string>("");
  const [dashboardDevice2, setDashboardDevice2] = useState<string>("");

  // Note: Window close behavior (minimize to tray vs quit) is handled
  // in the Rust backend via on_window_event for consistent behavior

  // Show loading state while contexts initialize
  if (settingsLoading || soundsLoading) {
    return (
      <div className="w-full h-full bg-discord-darkest flex items-center justify-center">
        <div className="text-discord-text-muted text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-discord-darkest flex">
      {/* Sidebar Navigation */}
      <div className="w-20 bg-discord-darker border-r border-discord-dark flex flex-col items-center py-6 space-y-4">
        {/* Logo/Home */}
        <div
          className="w-12 h-12 bg-discord-primary rounded-full flex items-center justify-center text-2xl cursor-pointer hover:bg-discord-primary-hover transition-colors"
          onClick={() => setCurrentView("dashboard")}
          title="Dashboard"
        >
          🎵
        </div>

        <div className="w-full h-px bg-discord-dark"></div>

        {/* Navigation Icons */}
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${
            currentView === "dashboard"
              ? "bg-discord-primary text-white"
              : "bg-discord-dark text-discord-text-muted hover:bg-discord-dark hover:text-discord-text"
          }`}
          title="Dashboard"
        >
          🏠
        </button>

        <button
          onClick={() => setCurrentView("settings")}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${
            currentView === "settings"
              ? "bg-discord-primary text-white"
              : "bg-discord-dark text-discord-text-muted hover:bg-discord-dark hover:text-discord-text"
          }`}
          title="Settings"
        >
          ⚙️
        </button>

        {/* Update Button - pushed to bottom */}
        {updateState.available && (
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="mt-auto w-12 h-12 rounded-full flex items-center justify-center
                       bg-discord-primary/20 hover:bg-discord-primary/30
                       text-discord-primary transition-colors relative"
            title={`Update to ${updateState.available?.version}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {/* Pulse dot */}
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-discord-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-discord-primary"></span>
            </span>
          </button>
        )}
      </div>

      {/* Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateState={updateState}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <ErrorBoundary>
          {currentView === "dashboard" && (
            <Dashboard
              device1={dashboardDevice1}
              device2={dashboardDevice2}
              setDevice1={setDashboardDevice1}
              setDevice2={setDashboardDevice2}
            />
          )}
          {currentView === "settings" && <Settings />}
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AudioProvider>
        <ErrorBoundary>
          <SettingsProvider>
            <ErrorBoundary>
              <SoundLibraryProvider>
                <AppContent />
              </SoundLibraryProvider>
            </ErrorBoundary>
          </SettingsProvider>
        </ErrorBoundary>
      </AudioProvider>
    </ErrorBoundary>
  );
}

export default App;
