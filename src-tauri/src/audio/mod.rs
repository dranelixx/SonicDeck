//! Audio module for SonicDeck
//!
//! Provides dual-output audio routing with cpal-based playback.

mod decode;
mod device;
mod error;
mod manager;
mod playback;

pub use decode::decode_audio_file;
pub use device::enumerate_devices;
pub use error::AudioError;
pub use manager::AudioManager;
pub use playback::create_playback_stream;

use serde::{Deserialize, Serialize};

/// Type-safe device identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct DeviceId(String);

impl DeviceId {
    /// Create a new device ID from an index
    pub fn from_index(index: usize) -> Self {
        Self(format!("device_{}", index))
    }

    /// Parse the device index from the ID
    pub fn index(&self) -> Result<usize, AudioError> {
        self.0
            .strip_prefix("device_")
            .and_then(|s| s.parse().ok())
            .ok_or_else(|| AudioError::InvalidDeviceId(self.0.clone()))
    }

    /// Get the raw string ID
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for DeviceId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Represents an audio output device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDevice {
    /// Unique identifier for the device
    pub id: DeviceId,
    /// Human-readable name of the device
    pub name: String,
    /// Whether this is the system default device
    pub is_default: bool,
}

/// Holds audio data decoded from file
#[derive(Clone)]
pub struct AudioData {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
}