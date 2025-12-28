# SonicDeck 🎵

**High-performance desktop soundboard application built with Tauri v2, Rust, React, and TypeScript.**

Designed for gamers, streamers, and content creators who need professional audio routing with minimal latency. SonicDeck features a sleek, Discord-inspired dark theme and powerful audio management tools.

---

## ✨ Features

### 🎧 Dual-Audio Routing
Play sounds to two separate audio devices simultaneously (e.g., headphones + virtual audio cable for streaming).

### 🎛️ Sound Library Management
- **Category Organization**: Organize sounds with custom categories
- **Drag & Drop Import**: Drop MP3, WAV, OGG, or M4A/AAC files directly into the app
- **Favorites System**: Star your most-used sounds for quick access
- **Custom Icons**: Assign emojis to sounds with built-in picker
- **Per-Sound Volume**: Individual volume control for each sound

### 📊 Audio Caching & Waveform Visualization
- **LRU Memory Cache**: 500MB cache for instant repeated playback
- **Real-time Waveform Display**: High-DPI canvas rendering with playback progress
- **Interactive Trim Editor**: Non-destructive audio trimming with visual feedback
- **Trim-aware Playback**: Audio automatically starts/ends at trimmed boundaries

### 🎨 Modern UI/UX
- Discord-inspired dark theme
- Smooth animations and transitions
- Toast notifications for user feedback
- Responsive layout with drag & drop support

### ⚡ Performance
- **Low-Latency Audio Engine**: Fixed 256-sample buffer size for minimal audio delay
- **Seamless Sound Restart**: Instant retriggering without audio gaps or clicks
- **Rust Backend**: Built with `cpal` + `symphonia` for high-performance audio processing
- **Thread-per-playback**: Parallel sound playback without blocking
- **Background Decoding**: No UI freezes, even with large files
- **Optimized React Components**: Memoization prevents unnecessary re-renders

### ⌨️ Global Hotkeys & System Integration
- **Global Hotkeys**: Trigger sounds from anywhere with customizable keyboard shortcuts
- **System Tray**: Minimize to tray with quick access menu
- **Autostart**: Optional launch on system boot
- **Start Minimized**: Begin in system tray for unobtrusive startup

## 🗺️ Development Status

- ✅ **Phase 1**: Audio Foundation (Dual-output engine, device enumeration)
- ✅ **Phase 2**: Settings & UI (Device configuration, navigation)
- ✅ **Phase 3**: Sound Library Management (Categories, favorites, drag & drop)
- ✅ **Phase 4**: Audio Caching, Waveform Visualization & Trim Editor
- ✅ **Phase 5**: System Integration (Global hotkeys, system tray, autostart)
- 🚀 **Current**: Beta testing, bug fixes, polish, and community feedback

### Planned Features
- **Auto-Updater** – Seamless updates without manual reinstallation
- **Import/Export** – Library migration via JSON/ZIP
- **OBS Integration** – Scene-based sound triggers via WebSocket
- **Audio Effects & Voice Changer** – EQ, Reverb, Pitch Shifting
- **Device Profiles & Auto-Switch** – Save device setups, auto-reconnect on change
- **Mobile Web-Remote** – Control via smartphone browser (no app install needed)
- **Game-Aware Profiles** – Auto-switch profiles per game

## 🐛 Beta Testing & Logging

**Log Files for Bug Reports:**
- Location: `%LOCALAPPDATA%\com.sonicdeck.app\logs\`
- Format: `sonicdeck.YYYY-MM-DD.log` (e.g., `sonicdeck.2025-12-28.log`)
- Daily rotation (last 7 days kept automatically)
- Contains timestamps, thread IDs, errors, and detailed operation logs

**Debug Mode for Detailed Logs:**
To help diagnose issues, run SonicDeck with the `--debug` flag:
- **Shortcut Method**: Right-click SonicDeck shortcut → Properties → Add `--debug` to Target field after `.exe`
- **Command Line**: `SonicDeck.exe --debug`
- **Result**: Enables detailed debug-level logging (device timings, cache operations, stream creation, etc.)

**For Testers:** If you encounter bugs, please:
1. Run SonicDeck with `--debug` flag to capture detailed logs
2. Reproduce the issue
3. Include the log file from `%LOCALAPPDATA%\com.sonicdeck.app\logs\` in your bug report

See `docs/testing/TESTING_GUIDE_EN.html` for detailed instructions.

## 🎨 Looking for an Artist!

**I'm searching for a talented artist to create visual assets for SonicDeck!**

Needed:
- App branding (logo, icons, banners)
- UI/UX design elements
- Social media graphics
- Presentation materials
- Marketing visuals
- Anything else to enhance the project's visual identity

**This is an open-source community project - contributions are unpaid.**  
If you're passionate about design and want to contribute to an open-source project, please reach out:
- 📧 Email: adrikonop@gmail.com
- 💬 Discord: dranelixx (ID: 624679678573150219)

---

## 🚀 Getting Started

> **Note**: SonicDeck is currently in **beta testing** with all core features complete. I'm actively gathering feedback and fixing bugs!

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Yarn Package Manager](https://yarnpkg.com/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation & Running

1. **Clone the repository:**

   ```sh
   git clone https://github.com/DraneLixX/SonicDeck.git
   cd SonicDeck
   ```

2. **Install frontend dependencies:**

   ```sh
   yarn install
   ```

3. **Run the development server:**

   ```sh
   yarn tauri dev
   ```

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, improvements, or bug fixes, please feel free to:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please make sure your code adheres to the project's conventions and includes tests where applicable.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Copyright Notice

```
Copyright (c) 2025 Adrian Konopczynski (DraneLixX)
SonicDeck - High-Performance Desktop Soundboard
```

**What this means:**
- ✅ You can use, modify, and distribute this software freely
- ✅ You can use it for commercial purposes
- ✅ You must include the copyright notice and license in any copies
- ⚠️ The software is provided "as-is" without warranty
- 💡 Future paid features may be offered under a separate commercial license

---

## 📞 Contact & Support

**Developer:** Adrian Konopczynski (DraneLixX)
- 📧 Email: adrikonop@gmail.com
- 💬 Discord: dranelixx (ID: 624679678573150219)
- 🐛 GitHub Issues: [Report a Bug](https://github.com/DraneLixX/SonicDeck/issues)
- 🌐 Repository: [github.com/DraneLixX/SonicDeck](https://github.com/DraneLixX/SonicDeck)

---

Built with ❤️ by [Adrian Konopczynski (DraneLixX)](https://github.com/DraneLixX)
