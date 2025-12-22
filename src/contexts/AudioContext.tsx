import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { AudioDevice } from "../types";

interface AudioContextType {
  devices: AudioDevice[];
  refreshDevices: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await invoke<AudioDevice[]>("list_audio_devices");
      setDevices(deviceList);
    } catch (error) {
      console.error("Failed to refresh devices:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await refreshDevices();
      } catch (error) {
        console.error("Failed to load devices:", error);
      }
    };
    loadDevices();
  }, [refreshDevices]);

  return (
    <AudioContext.Provider value={{ devices, refreshDevices }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}
