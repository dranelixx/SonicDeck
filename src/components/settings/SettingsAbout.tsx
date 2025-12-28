import { open } from "@tauri-apps/plugin-shell";

export default function SettingsAbout() {
  const handleExternalLink = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    try {
      await open(url);
      console.log("Opened URL:", url);
    } catch (error) {
      console.error("Failed to open URL:", url, error);
      // Fallback: show error to user
      alert(`Failed to open link: ${url}\nError: ${error}`);
    }
  };
  const appVersion = import.meta.env.VITE_APP_VERSION || "unknown";
  const appChannel = import.meta.env.VITE_APP_CHANNEL || "";

  // Display version with channel (e.g., "v0.7.0-alpha" instead of "v0.7.0-0")
  const displayVersion = appChannel
    ? `v${appVersion.replace(/-\d+$/, "")}-${appChannel}`
    : `v${appVersion}`;

  return (
    <div className="bg-discord-dark rounded-lg p-6 border-l-4 border-discord-primary">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🎵</span>
        <div>
          <h3 className="text-xl font-bold text-discord-text">SonicDeck</h3>
          <p className="text-sm text-discord-text-muted">{displayVersion}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <p className="text-discord-text-muted">
          High-performance desktop soundboard built with Tauri v2, Rust, React,
          and TypeScript.
        </p>

        {/* Copyright */}
        <div className="pt-3 border-t border-discord-darker">
          <p className="text-xs text-discord-text-muted">
            © 2025 Adrian Konopczynski (DraneLixX)
          </p>
          <p className="text-xs text-discord-text-muted mt-1">
            Licensed under the{" "}
            <a
              href="https://github.com/DraneLixX/SonicDeck/blob/main/LICENSE"
              onClick={(e) =>
                handleExternalLink(
                  e,
                  "https://github.com/DraneLixX/SonicDeck/blob/main/LICENSE"
                )
              }
              className="text-discord-primary hover:underline cursor-pointer"
            >
              MIT License
            </a>{" "}
            • Open-Source Software
          </p>
        </div>

        {/* Contact & Support */}
        <div className="pt-3 border-t border-discord-darker">
          <h4 className="text-sm font-semibold text-discord-text mb-2">
            📞 Contact & Support
          </h4>
          <div className="space-y-1.5 text-xs text-discord-text-muted">
            <p>
              📧 Email:{" "}
              <a
                href="mailto:adrikonop@gmail.com"
                onClick={(e) =>
                  handleExternalLink(e, "mailto:adrikonop@gmail.com")
                }
                className="text-discord-primary hover:underline cursor-pointer"
              >
                adrikonop@gmail.com
              </a>
            </p>
            <p>
              💬 Discord: <span className="text-discord-text">dranelixx</span>
              <span className="text-discord-text-muted ml-1">
                (ID: 624679678573150219)
              </span>
            </p>
            <p>
              🐛 Report Bugs:{" "}
              <a
                href="https://github.com/DraneLixX/SonicDeck/issues"
                onClick={(e) =>
                  handleExternalLink(
                    e,
                    "https://github.com/DraneLixX/SonicDeck/issues"
                  )
                }
                className="text-discord-primary hover:underline cursor-pointer"
              >
                GitHub Issues
              </a>
            </p>
            <p>
              🌐 Source Code:{" "}
              <a
                href="https://github.com/DraneLixX/SonicDeck"
                onClick={(e) =>
                  handleExternalLink(
                    e,
                    "https://github.com/DraneLixX/SonicDeck"
                  )
                }
                className="text-discord-primary hover:underline cursor-pointer"
              >
                github.com/DraneLixX/SonicDeck
              </a>
            </p>
          </div>
        </div>

        {/* Artist Wanted */}
        <div className="pt-3 border-t border-discord-darker bg-discord-primary/10 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <h4 className="text-sm font-semibold text-discord-primary mb-2">
            🎨 Artist Wanted!
          </h4>
          <p className="text-xs text-discord-text-muted">
            We're looking for an artist to create visual assets (icons, UI
            design, branding, etc.) for SonicDeck. This is an open-source
            community project - unpaid, but with credit!
          </p>
          <p className="text-xs text-discord-text-muted mt-2">
            Interested? Contact via email or Discord above.
          </p>
        </div>
      </div>
    </div>
  );
}
