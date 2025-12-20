import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { DashboardProps, Sound } from "../types";
import CategoryTabs from "./CategoryTabs";
import SoundButton from "./SoundButton";
import SoundModal from "./SoundModal";

// Debug logging flag - only active in development
const DEBUG = import.meta.env.DEV;

export default function Dashboard({
  devices,
  settings,
  soundLibrary,
  refreshSounds,
  device1,
  device2,
  setDevice1,
  setDevice2,
}: DashboardProps) {
  const [volume, setVolume] = useState<number>(0.5);
  const [status, setStatus] = useState<string>("Ready");
  const [playingSoundIds, setPlayingSoundIds] = useState<Set<string>>(new Set());
  const [hasLoadedSettings, setHasLoadedSettings] = useState<boolean>(false);

  // Category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<Sound | null>(null);
  const [droppedFilePath, setDroppedFilePath] = useState<string | null>(null);
  const [fileQueue, setFileQueue] = useState<string[]>([]);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Global context menu state - only one menu open at a time
  const [openContextMenu, setOpenContextMenu] = useState<{type: 'sound' | 'category', id: string} | null>(null);

  // Apply settings from props only once on initial load
  useEffect(() => {
    if (settings && !hasLoadedSettings) {
      if (settings.monitor_device_id) {
        setDevice1(settings.monitor_device_id);
      }
      if (settings.broadcast_device_id) {
        setDevice2(settings.broadcast_device_id);
      }
      if (settings.default_volume !== undefined) {
        setVolume(settings.default_volume);
      }
      setHasLoadedSettings(true);
    }
  }, [settings, hasLoadedSettings, setDevice1, setDevice2]);

  // Set initial category when categories load
  useEffect(() => {
    if (soundLibrary.categories.length > 0 && !selectedCategoryId) {
      const sorted = [...soundLibrary.categories].sort((a, b) => a.sort_order - b.sort_order);
      setSelectedCategoryId(sorted[0]?.id || "");
    }
  }, [soundLibrary.categories, selectedCategoryId]);

  // Listen for audio events and file drops
  useEffect(() => {
    const unlisten = listen<string>("audio-decode-complete", (event) => {
      setStatus(`Playing (ID: ${event.payload})`);
    });

    const unlistenError = listen<string>("audio-decode-error", (event) => {
      setStatus(`Decode Error: ${event.payload}`);
    });

    const unlistenComplete = listen<string>("playback-complete", (event) => {
      const completedPlaybackId = event.payload;
      if (DEBUG) console.log(`🏁 Playback complete: ${completedPlaybackId}`);
      
      // Use REF to find sound ID (avoid stale closure from state)
      let soundId: string | null = null;
      for (const [sid, pid] of playingSoundsRef.current.entries()) {
        if (pid === completedPlaybackId) {
          soundId = sid;
          break;
        }
      }
      
      if (!soundId) {
        if (DEBUG) console.log(`⚠️ Playback ${completedPlaybackId} not found in ref`);
        return;
      }
      
      if (DEBUG) console.log(`✅ Cleaning up playback for sound: ${soundId}`);
      
      // Clean up all tracking
      playingSoundsRef.current.delete(soundId);
      setPlayingSoundIds(prev => {
        const next = new Set(prev);
        next.delete(soundId);
        return next;
      });
      
      setStatus("Ready");
    });

    // Listen for file drops (Tauri v2 event system)
    const unlistenFileDrop = listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
      if (DEBUG) console.log('FILE DROP EVENT:', event);
      // Payload structure: { paths: string[], position: { x, y } }
      const paths = event.payload.paths || event.payload;
      if (DEBUG) console.log('Extracted paths:', paths);
      
      if (!Array.isArray(paths)) {
        console.error('Unexpected payload format:', event.payload);
        return;
      }
      
      const audioFiles = paths.filter((path: string) =>
        /\.(mp3|wav|ogg|m4a|flac)$/i.test(path)
      );
      
      if (audioFiles.length > 0) {
        if (DEBUG) console.log(`✅ Dropped ${audioFiles.length} audio file(s):`, audioFiles);
        // Multi-file import: queue all files
        if (audioFiles.length === 1) {
          // Single file - open modal directly
          setDroppedFilePath(audioFiles[0]);
          setEditingSound(null);
          setIsModalOpen(true);
          setStatus(`Adding sound from file`);
        } else {
          // Multiple files - start queue
          setFileQueue(audioFiles);
          setDroppedFilePath(audioFiles[0]);
          setEditingSound(null);
          setIsModalOpen(true);
          setStatus(`Adding ${audioFiles.length} sounds (1/${audioFiles.length})`);
        }
      } else {
        setStatus("Please drop an audio file (MP3, WAV, OGG, M4A)");
      }
    });

    const unlistenFileHover = listen('tauri://drag', () => {
      if (DEBUG) console.log('FILE HOVER EVENT');
      setIsDragging(true);
    });

    const unlistenFileCancel = listen('tauri://drag-cancelled', () => {
      if (DEBUG) console.log('FILE CANCEL EVENT');
      setIsDragging(false);
    });

    if (DEBUG) console.log('✅ File drop listeners registered');

    return () => {
      unlisten.then((fn: () => void) => fn());
      unlistenError.then((fn: () => void) => fn());
      unlistenComplete.then((fn: () => void) => fn());
      unlistenFileDrop.then((fn: () => void) => fn());
      unlistenFileHover.then((fn: () => void) => fn());
      unlistenFileCancel.then((fn: () => void) => fn());
    };
  }, []);

  // Check if devices are configured
  const devicesConfigured = device1 && device2;

  // Get sounds for selected category and favorites filter, then sort
  const filteredSounds = soundLibrary.sounds
    .filter(s => {
      const matchesCategory = s.category_id === selectedCategoryId;
      const matchesFavorite = !showFavoritesOnly || s.is_favorite;
      return matchesCategory && matchesFavorite;
    })
    .sort((a, b) => {
      // Favorites first
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      // Then alphabetically by name
      return a.name.localeCompare(b.name);
    });


  // Check if selected devices are still available
  useEffect(() => {
    if (devices.length > 0 && device1 && device2) {
      const device1Available = devices.some(d => d.id === device1);
      const device2Available = devices.some(d => d.id === device2);

      if (!device1Available) {
        setDevice1("");
        setStatus("Warning: Monitor output device disconnected");
      }
      if (!device2Available) {
        setDevice2("");
        setStatus("Warning: Broadcast output device disconnected");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.length]);

  // Track playing sounds
  const playingSoundsRef = useRef<Map<string, string>>(new Map()); // sound_id -> playback_id

  const playSound = useCallback(async (sound: Sound) => {
    if (!device1 || !device2) {
      setStatus("Please configure audio devices in Settings first");
      return;
    }

    if (DEBUG) {
      console.log(`\n=== PlaySound: ${sound.name} ===`);
      console.log(`Ref state:`, Array.from(playingSoundsRef.current.entries()));
      console.log(`Playing IDs:`, Array.from(playingSoundIds));
    }

    // Check ref for immediate state
    const currentPlaybackId = playingSoundsRef.current.get(sound.id);
    const shouldRestart = !!currentPlaybackId;

    if (DEBUG) console.log(`Should restart: ${shouldRestart}, Playback ID: ${currentPlaybackId || 'NONE'}`);

    if (shouldRestart && currentPlaybackId) {
      if (DEBUG) console.log(`🔄 Restarting: ${sound.name} (${currentPlaybackId})`);
      setStatus(`Restarting: ${sound.name}...`);
      
      try {
        await invoke("stop_playback", { playbackId: currentPlaybackId });
        if (DEBUG) console.log(`✅ Stopped playback: ${currentPlaybackId}`);
        
        // Clean up tracking
        playingSoundsRef.current.delete(sound.id);
        setPlayingSoundIds(prev => {
          const next = new Set(prev);
          next.delete(sound.id);
          return next;
        });
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
        if (DEBUG) console.log(`✅ Cleanup complete`);
      } catch (err) {
        console.error("Failed to stop playback:", err);
      }
    } else {
      if (DEBUG) console.log(`▶️ Starting fresh playback`);
    }

    // Start playback
    try {
      setStatus(`Loading: ${sound.name}...`);
      setPlayingSoundIds(prev => new Set(prev).add(sound.id));

      const playbackVolume = sound.volume ?? volume;

      const playbackId = await invoke<string>("play_dual_output", {
        filePath: sound.file_path,
        deviceId1: device1,
        deviceId2: device2,
        volume: playbackVolume,
      });

      if (DEBUG) console.log(`✅ Started playback: ${playbackId} for ${sound.name}`);

      // Track in ref
      playingSoundsRef.current.set(sound.id, playbackId);
    } catch (error) {
      console.error(`Playback error:`, error);
      setStatus(`Error: ${error}`);
      playingSoundsRef.current.delete(sound.id);
      setPlayingSoundIds(prev => {
        const next = new Set(prev);
        next.delete(sound.id);
        return next;
      });
    }
  }, [device1, device2, volume]);

  const stopAllAudio = async () => {
    try {
      await invoke("stop_all_audio");
      playingSoundsRef.current.clear();
      setPlayingSoundIds(new Set());
      setStatus("All audio stopped");
    } catch (error) {
      setStatus(`Stop Error: ${error}`);
    }
  };

  const handleAddSound = async () => {
    // Open file dialog for multiple files
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: "Audio Files",
          extensions: ["mp3", "wav", "ogg", "m4a", "flac"]
        }]
      });

      if (!selected) return; // User cancelled

      // Handle both single file (string) and multiple files (array)
      const files = Array.isArray(selected) ? selected : [selected];
      const audioFiles = files.filter((path: string) =>
        /\.(mp3|wav|ogg|m4a|flac)$/i.test(path)
      );

      if (audioFiles.length === 0) {
        setStatus("No audio files selected");
        return;
      }

      if (audioFiles.length === 1) {
        // Single file - open modal directly
        setDroppedFilePath(audioFiles[0]);
        setEditingSound(null);
        setIsModalOpen(true);
      } else {
        // Multiple files - start queue
        setFileQueue(audioFiles);
        setDroppedFilePath(audioFiles[0]);
        setEditingSound(null);
        setIsModalOpen(true);
        setStatus(`Adding ${audioFiles.length} sounds (1/${audioFiles.length})`);
      }
    } catch (error) {
      console.error("File dialog error:", error);
      setStatus(`Error opening file dialog: ${error}`);
    }
  };

  const handleEditSound = (sound: Sound) => {
    setEditingSound(sound);
    setDroppedFilePath(null);
    setIsModalOpen(true);
  };

  const handleDeleteSound = async (sound: Sound) => {
    if (!confirm(`Delete "${sound.name}"?`)) return;

    try {
      await invoke("delete_sound", { soundId: sound.id });
      await refreshSounds();
      setStatus(`Deleted: ${sound.name}`);
    } catch (error) {
      setStatus(`Delete Error: ${error}`);
    }
  };

  const handleToggleFavorite = async (sound: Sound) => {
    try {
      await invoke("toggle_favorite", {
        soundId: sound.id,
      });
      await refreshSounds();
      setStatus(sound.is_favorite ? `Removed from favorites: ${sound.name}` : `Added to favorites: ${sound.name}`);
    } catch (error) {
      setStatus(`Favorite Error: ${error}`);
    }
  };

  // Note: Drag & drop is handled by Tauri's onFileDropEvent listener above
  // These handlers are kept for visual feedback only
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="w-full h-full bg-discord-darkest flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="bg-discord-darker px-6 py-4 border-b border-discord-dark flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-discord-primary">
            SonicDeck
          </h1>
          <p className="text-sm text-discord-text-muted mt-1">
            {status}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Favorites Filter Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-2 rounded-lg font-medium transition-colors
                     ${showFavoritesOnly 
                       ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                       : "bg-discord-dark text-discord-text-muted hover:bg-discord-darker hover:text-discord-text"
                     }`}
            title={showFavoritesOnly ? "Show all sounds" : "Show favorites only"}
          >
            <span className="text-xl">⭐</span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <span className="text-discord-text-muted text-sm">Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
              style={{
                accentColor: volume >= 0.75 ? "#ef4444" : "#5865f2",
              }}
            />
            <span className={`text-sm w-10 ${volume >= 0.75 ? "text-red-400" : "text-discord-text"}`}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Stop All Button */}
          <button
            onClick={stopAllAudio}
            className="px-4 py-2 bg-discord-danger hover:bg-red-600 rounded-lg
                     text-white font-medium transition-colors"
          >
            Stop All
          </button>
        </div>
      </div>

      {/* Device Warning */}
      {!devicesConfigured && (
        <div className="mx-6 mt-4 bg-discord-warning/20 border border-discord-warning rounded-lg p-4">
          <h3 className="text-discord-warning font-semibold mb-1">
            Audio Devices Not Configured
          </h3>
          <p className="text-sm text-discord-text-muted">
            Please configure your Monitor and Broadcast devices in Settings before playing sounds.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        {/* Category Tabs */}
        <div className="mb-4">
          <CategoryTabs
            categories={soundLibrary.categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCategoriesChange={refreshSounds}
            openContextMenuId={openContextMenu?.type === 'category' ? openContextMenu.id : null}
            onContextMenuChange={(categoryId) => setOpenContextMenu(categoryId ? {type: 'category', id: categoryId} : null)}
          />
        </div>

        {/* Sound Grid */}
        <div className="flex-1 overflow-auto">
          {filteredSounds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-discord-text-muted">
              <div className="text-6xl mb-4">🔇</div>
              <p className="text-lg mb-2">No sounds in this category</p>
              <p className="text-sm mb-4">
                Click "Add Sound" or drag & drop an audio file to get started
              </p>
              <button
                onClick={handleAddSound}
                className="px-4 py-2 bg-discord-primary hover:bg-discord-primary-hover
                         rounded-lg text-white font-medium transition-colors"
              >
                + Add Sound
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredSounds.map((sound) => (
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  isPlaying={playingSoundIds.has(sound.id)}
                  onPlay={playSound}
                  onEdit={handleEditSound}
                  onDelete={handleDeleteSound}
                  onToggleFavorite={handleToggleFavorite}
                  showMenu={openContextMenu?.type === 'sound' && openContextMenu.id === sound.id}
                  onMenuChange={(show: boolean) => setOpenContextMenu(show ? {type: 'sound', id: sound.id} : null)}
                />
              ))}

              {/* Add Sound Button */}
              <button
                onClick={handleAddSound}
                className="h-24 rounded-lg border-2 border-dashed border-discord-dark
                         text-discord-text-muted hover:border-discord-primary
                         hover:text-discord-primary transition-colors
                         flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl">+</span>
                <span className="text-xs">Add Sound</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-discord-primary/20 border-4 border-dashed
                      border-discord-primary flex items-center justify-center pointer-events-none">
          <div className="bg-discord-dark rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-xl text-discord-text font-medium">
              Drop audio file to add sound
            </p>
            <p className="text-sm text-discord-text-muted mt-2">
              Supports MP3, WAV, OGG, M4A
            </p>
          </div>
        </div>
      )}

      {/* Sound Modal */}
      <SoundModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSound(null);
          setDroppedFilePath(null);
          setFileQueue([]);
        }}
        onSave={async () => {
          await refreshSounds();
          
          // Check if there are more files in queue
          if (fileQueue.length > 1) {
            // Remove first file and continue with next
            const remainingFiles = fileQueue.slice(1);
            const totalFiles = fileQueue.length;
            const currentFileNum = totalFiles - remainingFiles.length + 1;
            
            // Close modal briefly to trigger useEffect reset
            setIsModalOpen(false);
            
            // Then reopen with next file after a tiny delay
            setTimeout(() => {
              setFileQueue(remainingFiles);
              setDroppedFilePath(remainingFiles[0]);
              setEditingSound(null);
              setIsModalOpen(true);
              setStatus(`Adding sounds (${currentFileNum}/${totalFiles})`);
            }, 100);
          } else {
            // Queue finished
            const totalAdded = fileQueue.length;
            setFileQueue([]);
            setDroppedFilePath(null);
            if (totalAdded > 0) {
              setStatus(`Successfully added ${totalAdded} sounds!`);
            }
          }
        }}
        categories={soundLibrary.categories}
        sound={editingSound}
        defaultCategoryId={selectedCategoryId}
        defaultFilePath={droppedFilePath || undefined}
      />
    </div>
  );
}
