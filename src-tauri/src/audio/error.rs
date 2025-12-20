//! Error types for audio operations

use std::io;

/// Audio-related errors
#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error("Failed to open audio file: {0}")]
    FileOpen(#[from] io::Error),

    #[error("Failed to probe audio format: {0}")]
    ProbeFormat(String),

    #[error("No audio tracks found in file")]
    NoTracks,

    #[error("Failed to create decoder: {0}")]
    DecoderCreation(String),

    #[error("Error reading audio packet: {0}")]
    PacketRead(String),

    #[error("Decoding error: {0}")]
    Decode(String),

    #[error("No audio data decoded")]
    NoData,

    #[error("Failed to enumerate audio devices: {0}")]
    DeviceEnumeration(String),

    #[error("No audio output devices found")]
    NoDevices,

    #[error("Failed to get device configuration: {0}")]
    DeviceConfig(String),

    #[error("Unsupported sample format")]
    UnsupportedFormat,

    #[error("Failed to build output stream: {0}")]
    StreamBuild(String),

    #[error("Failed to start stream: {0}")]
    StreamStart(String),

    #[error("Invalid device ID: {0}")]
    InvalidDeviceId(String),

    #[error("Device not found: {0}")]
    DeviceNotFound(String),
}

/// Convert AudioError to String for Tauri commands
impl From<AudioError> for String {
    fn from(error: AudioError) -> Self {
        error.to_string()
    }
}
