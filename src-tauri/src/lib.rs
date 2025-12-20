//! SonicDeck - High-performance Desktop Soundboard
//!
//! Rust backend with dual-output audio routing (cpal-based implementation).

mod audio;
mod settings;

use std::sync::{Arc, Mutex};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use cpal::traits::HostTrait;
use tauri::{Emitter, State};

pub use audio::{AudioDevice, AudioManager, DeviceId};
pub use settings::AppSettings;

// ============================================================================
// TAURI COMMANDS - Audio
// ============================================================================

/// Lists all available output audio devices on the system
#[tauri::command]
fn list_audio_devices() -> Result<Vec<AudioDevice>, String> {
    audio::enumerate_devices().map_err(Into::into)
}

/// Plays an audio file simultaneously to two different output devices
#[tauri::command]
fn play_dual_output(
    file_path: String,
    device_id_1: DeviceId,
    device_id_2: DeviceId,
    volume: f32,
    manager: State<'_, AudioManager>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let volume = volume.clamp(0.0, 1.0);

    // Generate playback ID
    let playback_id = manager.next_playback_id();

    // Create stop channel
    let (stop_tx, stop_rx) = mpsc::channel();

    // Register the playback
    manager.register_playback(playback_id.clone(), stop_tx);

    // Create shared volume state for dynamic control
    let volume_state = Arc::new(Mutex::new(volume));

    // Clone for the thread
    let playback_id_clone = playback_id.clone();
    let manager_inner = manager.get_stop_senders();

    // Spawn dedicated playback thread (including decoding to avoid blocking UI)
    thread::spawn(move || {
        // Decode audio file in background thread
        let audio_data = match audio::decode_audio_file(&file_path) {
            Ok(data) => Arc::new(data),
            Err(e) => {
                eprintln!("Failed to decode audio: {}", e);
                manager_inner.lock().unwrap().remove(&playback_id_clone);
                // Emit error event
                let _ = app_handle.emit("audio-decode-error", format!("Failed to decode: {}", e));
                return;
            }
        };

        // Emit event that decoding is complete and playback is starting
        let _ = app_handle.emit("audio-decode-complete", &playback_id_clone);

        // This thread owns the streams - no Send issues!
        let host = cpal::default_host();

        let output_devices: Vec<_> = match host.output_devices() {
            Ok(devices) => devices.collect(),
            Err(e) => {
                eprintln!("Failed to enumerate devices: {}", e);
                manager_inner.lock().unwrap().remove(&playback_id_clone);
                return;
            }
        };

        // Parse device indices
        let (idx1, idx2) = match (device_id_1.index(), device_id_2.index()) {
            (Ok(i1), Ok(i2)) => (i1, i2),
            _ => {
                eprintln!("Invalid device IDs");
                manager_inner.lock().unwrap().remove(&playback_id_clone);
                return;
            }
        };

        let (Some(device_1), Some(device_2)) = (output_devices.get(idx1), output_devices.get(idx2)) else {
            eprintln!("Devices not found");
            manager_inner.lock().unwrap().remove(&playback_id_clone);
            return;
        };

        // Create streams with shared volume state
        let stream_1 = match audio::create_playback_stream(device_1, audio_data.clone(), volume_state.clone()) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to create stream 1: {}", e);
                manager_inner.lock().unwrap().remove(&playback_id_clone);
                return;
            }
        };

        let stream_2 = match audio::create_playback_stream(device_2, audio_data.clone(), volume_state.clone()) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to create stream 2: {}", e);
                manager_inner.lock().unwrap().remove(&playback_id_clone);
                return;
            }
        };

        // Calculate duration
        let duration_secs = audio_data.samples.len() as f64
            / (audio_data.sample_rate as f64 * audio_data.channels as f64);
        let total_sleep_ms = (duration_secs * 1000.0) as u64;

        // Wait for completion or stop signal
        let check_interval = Duration::from_millis(100);
        let mut elapsed_ms = 0u64;

        while elapsed_ms < total_sleep_ms {
            // Check for stop signal
            if stop_rx.try_recv().is_ok() {
                break;
            }

            thread::sleep(check_interval);
            elapsed_ms += 100;
        }

        // Clean up
        drop(stream_1);
        drop(stream_2);
        manager_inner.lock().unwrap().remove(&playback_id_clone);

        // Emit playback complete event
        let _ = app_handle.emit("playback-complete", &playback_id_clone);
    });

    Ok(playback_id)
}

/// Stops all currently playing audio
#[tauri::command]
fn stop_all_audio(manager: State<'_, AudioManager>) -> Result<(), String> {
    manager.stop_all();
    Ok(())
}

/// Stops a specific playback by ID
#[tauri::command]
fn stop_playback(
    playback_id: String,
    manager: State<'_, AudioManager>,
) -> Result<(), String> {
    if manager.signal_stop(&playback_id) {
        Ok(())
    } else {
        Err(format!("Playback not found: {}", playback_id))
    }
}

// ============================================================================
// TAURI COMMANDS - Settings
// ============================================================================

/// Load application settings from disk
#[tauri::command]
fn load_settings(app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    settings::load(&app_handle)
}

/// Save application settings to disk
#[tauri::command]
fn save_settings(
    settings: AppSettings,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    settings::save(&settings, &app_handle)
}

/// Get the settings file path (for debugging/info)
#[tauri::command]
fn get_settings_file_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = settings::get_settings_path(&app_handle)?;
    Ok(path.to_string_lossy().to_string())
}

// ============================================================================
// TAURI APP INITIALIZATION
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AudioManager::new())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            play_dual_output,
            stop_all_audio,
            stop_playback,
            load_settings,
            save_settings,
            get_settings_file_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
