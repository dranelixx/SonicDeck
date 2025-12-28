// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Sets up non-blocking file logging with daily rotation.
///
/// Returns a guard that must be kept alive for the duration of the application.
/// When dropped, the guard flushes any remaining buffered logs to disk.
///
/// # Arguments
/// * `debug_mode` - If true, enables debug-level logging (overrides default INFO level in release builds)
fn setup_logging(debug_mode: bool) -> tracing_appender::non_blocking::WorkerGuard {
    // Get app data directory for logs
    let app_data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.sonicdeck.app")
        .join("logs");

    // Create logs directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir).ok();

    // Clone for later use
    let logs_path = app_data_dir.clone();

    // Create file appender with daily rotation (keeps last 7 days)
    let file_appender = RollingFileAppender::builder()
        .rotation(Rotation::DAILY)
        .filename_prefix("sonicdeck")
        .filename_suffix("log")
        .max_log_files(7)
        .build(&app_data_dir)
        .expect("Failed to create log appender");

    // Wrap in non-blocking writer to prevent I/O from blocking audio threads
    // The guard must be kept alive - dropping it flushes remaining logs
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // Create file layer with non-blocking writer
    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false) // No color codes in log files
        .with_target(true)
        .with_thread_ids(true);

    // Create console layer (only in debug builds)
    let console_layer = if cfg!(debug_assertions) {
        Some(fmt::layer().with_writer(std::io::stderr).with_ansi(true))
    } else {
        None
    };

    // Setup log filter based on mode
    // Priority: --debug flag > debug build > release build
    let filter = if debug_mode {
        // Debug mode enabled via --debug flag
        EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("sonic_deck=debug,warn"))
    } else if cfg!(debug_assertions) {
        // Development build (default debug level)
        EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("sonic_deck=debug,warn"))
    } else {
        // Production build (default info level)
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("sonic_deck=info,warn"))
    };

    // Initialize subscriber with both layers
    tracing_subscriber::registry()
        .with(filter)
        .with(file_layer)
        .with(console_layer)
        .init();

    tracing::info!("Sonic Deck v{} starting up", env!("CARGO_PKG_VERSION"));
    tracing::info!("Logs directory: {}", logs_path.display());

    guard
}

fn main() {
    // Parse CLI arguments for --debug flag
    let args: Vec<String> = std::env::args().collect();
    let debug_mode = args.iter().any(|arg| arg == "--debug");

    // Keep guard alive for the entire application lifetime
    // This ensures logs are flushed when the app exits
    let _log_guard = setup_logging(debug_mode);

    if debug_mode {
        tracing::info!("Debug mode enabled via --debug flag");
    }

    sonic_deck::run();
}
