import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface AudioDevice {
  id: string;
  name: string;
  is_default: boolean;
}

function App() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [device1, setDevice1] = useState<string>("");
  const [device2, setDevice2] = useState<string>("");
  const [volume, setVolume] = useState<number>(0.8);
  const [testFile, setTestFile] = useState<string>("");
  const [status, setStatus] = useState<string>("Ready");
  const [loading, setLoading] = useState<boolean>(false);

  // Load audio devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const deviceList = await invoke<AudioDevice[]>("list_audio_devices");
      setDevices(deviceList);
      
      // Auto-select default device for device1
      const defaultDevice = deviceList.find(d => d.is_default);
      if (defaultDevice) {
        setDevice1(defaultDevice.id);
      }
      
      setStatus("Devices loaded successfully");
    } catch (error) {
      setStatus(`Error: ${error}`);
      console.error("Failed to load devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const testDualOutput = async () => {
    if (!device1 || !device2) {
      setStatus("Please select both output devices");
      return;
    }

    if (!testFile) {
      setStatus("Please provide a test audio file path");
      return;
    }

    try {
      setLoading(true);
      setStatus("Playing audio...");
      
      const playbackId = await invoke<string>("play_dual_output", {
        filePath: testFile,
        deviceId1: device1,
        deviceId2: device2,
        volume: volume,
      });
      
      setStatus(`Playing on both devices (ID: ${playbackId})`);
    } catch (error) {
      setStatus(`Playback Error: ${error}`);
      console.error("Playback failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const stopAll = async () => {
    try {
      await invoke("stop_all_audio");
      setStatus("All audio stopped");
    } catch (error) {
      setStatus(`Stop Error: ${error}`);
      console.error("Stop failed:", error);
    }
  };

  return (
    <div className="w-full h-full bg-discord-darkest flex flex-col">
      {/* Header */}
      <div className="bg-discord-darker px-6 py-4 border-b border-discord-dark">
        <h1 className="text-2xl font-bold text-discord-primary">
          🎵 SonicDeck - Audio Test
        </h1>
        <p className="text-sm text-discord-text-muted mt-1">
          Test the dual-output audio routing functionality
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Status Banner */}
          <div className="bg-discord-dark rounded-lg p-4 border border-discord-darker">
            <div className="flex items-center justify-between">
              <span className="text-discord-text-muted">Status:</span>
              <span className="text-discord-text font-medium">{status}</span>
            </div>
          </div>

          {/* Device Selection */}
          <div className="bg-discord-dark rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-discord-text mb-4">
              Audio Devices
            </h2>
            
            <button
              onClick={loadDevices}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-discord-primary hover:bg-discord-primary-hover 
                       disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white 
                       font-medium transition-colors"
            >
              {loading ? "Loading..." : "Refresh Devices"}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Device 1 (Monitor) */}
              <div>
                <label className="block text-sm font-medium text-discord-text-muted mb-2">
                  Device 1 (Monitor Output)
                </label>
                <select
                  value={device1}
                  onChange={(e) => setDevice1(e.target.value)}
                  className="w-full bg-discord-darker border border-discord-dark rounded px-3 py-2 
                           text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary"
                >
                  <option value="">Select a device...</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} {device.is_default ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device 2 (Broadcast) */}
              <div>
                <label className="block text-sm font-medium text-discord-text-muted mb-2">
                  Device 2 (Broadcast Output)
                </label>
                <select
                  value={device2}
                  onChange={(e) => setDevice2(e.target.value)}
                  className="w-full bg-discord-darker border border-discord-dark rounded px-3 py-2 
                           text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary"
                >
                  <option value="">Select a device...</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} {device.is_default ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Device List */}
            <div className="mt-4">
              <p className="text-sm text-discord-text-muted mb-2">
                Available Devices: {devices.length}
              </p>
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-discord-darker rounded px-3 py-2 text-sm"
                  >
                    <span className="text-discord-text">{device.name}</span>
                    {device.is_default && (
                      <span className="ml-2 px-2 py-0.5 bg-discord-success rounded text-xs text-white">
                        DEFAULT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="bg-discord-dark rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-discord-text mb-4">
              Playback Test
            </h2>

            {/* File Path Input */}
            <div>
              <label className="block text-sm font-medium text-discord-text-muted mb-2">
                Test Audio File Path
              </label>
              <input
                type="text"
                value={testFile}
                onChange={(e) => setTestFile(e.target.value)}
                placeholder="e.g., C:/Users/YourName/Music/test.mp3"
                className="w-full bg-discord-darker border border-discord-dark rounded px-3 py-2 
                         text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary"
              />
              <p className="text-xs text-discord-text-muted mt-1">
                Enter the full path to an MP3, WAV, or OGG file
              </p>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium text-discord-text-muted mb-2">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={testDualOutput}
                disabled={loading || !device1 || !device2 || !testFile}
                className="flex-1 px-6 py-3 bg-discord-success hover:bg-green-600 
                         disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg 
                         text-white font-semibold transition-colors"
              >
                ▶ Test Dual Output
              </button>
              <button
                onClick={stopAll}
                className="px-6 py-3 bg-discord-danger hover:bg-red-600 rounded-lg 
                         text-white font-semibold transition-colors"
              >
                ⏹ Stop All
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-discord-dark rounded-lg p-6">
            <h3 className="text-lg font-semibold text-discord-text mb-3">
              📝 Testing Instructions
            </h3>
            <ul className="space-y-2 text-sm text-discord-text-muted">
              <li>1. Click "Refresh Devices" to load available audio outputs</li>
              <li>2. Select two different output devices (e.g., Headphones + Virtual Cable)</li>
              <li>3. Enter the full path to a test audio file</li>
              <li>4. Adjust the volume slider if needed</li>
              <li>5. Click "Test Dual Output" to play the sound on both devices simultaneously</li>
              <li>6. Use "Stop All" to stop any playing audio</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
