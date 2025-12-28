//! Atomic file persistence utilities
//!
//! Provides crash-safe file writing using the write-to-temp-and-rename pattern.

use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::path::Path;
use std::time::Instant;
use tracing::debug;

/// Writes data atomically to a file.
///
/// Uses the pattern: tempfile → write → flush → fsync → rename
/// This ensures that either the old file or the new file exists,
/// but never a corrupted partial write.
pub fn atomic_write(path: &Path, data: &str) -> Result<(), String> {
    let start = Instant::now();
    let bytes_written = data.len();
    let path_str = path.display().to_string();

    debug!(path = %path_str, bytes = bytes_written, "Starting atomic write");

    let temp_path = path.with_extension("json.tmp");

    // Create temp file
    let file =
        File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;

    let mut writer = BufWriter::new(file);

    // Write data to buffer
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Failed to write data: {}", e))?;

    // Flush buffer to OS
    writer
        .flush()
        .map_err(|e| format!("Failed to flush buffer: {}", e))?;

    // Force sync to disk (fsync)
    writer
        .get_ref()
        .sync_all()
        .map_err(|e| format!("Failed to sync to disk: {}", e))?;

    // Atomic rename (overwrites target on Windows)
    fs::rename(&temp_path, path).map_err(|e| format!("Failed to rename temp file: {}", e))?;

    let duration_ms = start.elapsed().as_millis();
    debug!(
        path = %path_str,
        bytes_written = bytes_written,
        duration_ms = duration_ms,
        "Atomic write complete"
    );

    Ok(())
}
