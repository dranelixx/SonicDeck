//! Audio playback lifecycle management
//!
//! Manages active playbacks with thread-safe stop signaling.

use std::collections::HashMap;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

/// Manages audio playback state and active streams
pub struct AudioManager {
    /// Stop signals for active playbacks (send () to stop)
    stop_senders: Arc<Mutex<HashMap<String, Sender<()>>>>,
    /// Counter for generating unique playback IDs
    playback_counter: Arc<Mutex<u64>>,
}

impl AudioManager {
    pub fn new() -> Self {
        Self {
            stop_senders: Arc::new(Mutex::new(HashMap::new())),
            playback_counter: Arc::new(Mutex::new(0)),
        }
    }

    /// Generate a unique playback ID
    pub fn next_playback_id(&self) -> String {
        let mut counter = self.playback_counter.lock().unwrap();
        *counter += 1;
        format!("playback_{}", *counter)
    }

    /// Register a stop sender for a playback
    pub fn register_playback(&self, playback_id: String, sender: Sender<()>) {
        let mut senders = self.stop_senders.lock().unwrap();
        senders.insert(playback_id, sender);
    }

    /// Unregister a playback (called when playback completes)
    #[allow(dead_code)]
    pub fn unregister_playback(&self, playback_id: &str) {
        let mut senders = self.stop_senders.lock().unwrap();
        senders.remove(playback_id);
    }

    /// Stop all active playbacks
    pub fn stop_all(&self) {
        let mut senders = self.stop_senders.lock().unwrap();
        for (_, sender) in senders.drain() {
            let _ = sender.send(()); // Ignore errors if thread already stopped
        }
    }

    /// Signal a specific playback to stop
    pub fn signal_stop(&self, playback_id: &str) -> bool {
        let mut senders = self.stop_senders.lock().unwrap();
        if let Some(sender) = senders.remove(playback_id) {
            let _ = sender.send(());
            true
        } else {
            false
        }
    }

    /// Get a clone of the stop_senders Arc for use in spawned threads
    pub fn get_stop_senders(&self) -> Arc<Mutex<HashMap<String, Sender<()>>>> {
        self.stop_senders.clone()
    }
}

impl Default for AudioManager {
    fn default() -> Self {
        Self::new()
    }
}
