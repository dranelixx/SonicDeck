# Version Management

Sonic Deck uses a centralized version system to keep all version strings in sync across the project.

## How to Bump the Version

1. **Edit `version.json`** with the new version:
   ```json
   {
     "version": "0.3.0-alpha",
     "prerelease": true,
     "channel": "alpha",
     "releaseDate": "2025-12-25",
     "description": "Your release notes here"
   }
   ```

2. **Commit your changes:**
   ```bash
   git add version.json
   git commit -m "chore: bump version to 0.3.0-alpha"
   ```

3. **The pre-commit hook automatically:**
   - Runs `sync-version.js`
   - Updates `package.json`, `Cargo.toml`, `tauri.conf.json`
   - Stages the synced files
   - Everything is committed together

## Version Format

Sonic Deck follows **Semantic Versioning (SemVer)** with pre-release identifiers:

- `0.2.0-alpha` - Early development, many features experimental
- `0.5.0-beta` - Beta phase, most features stable, some polishing needed
- `1.0.0` - Stable release

## Files Included in Sync

- `version.json` - **Source of truth** (edit this only)
- `package.json` - Frontend version (auto-synced)
- `src-tauri/Cargo.toml` - Rust backend version (auto-synced)
- `src-tauri/tauri.conf.json` - Tauri app configuration (auto-synced)

## Using Version in Code

### Frontend (React/TypeScript)

Use the `VITE_APP_VERSION` environment variable in React components:

```typescript
// Any React component
const appVersion = import.meta.env.VITE_APP_VERSION;

export const MyComponent = () => (
  <p>Version: {appVersion}</p>
);
```

**How it works:**
- Set at **build-time** from `version.json` in `vite.config.ts`
- Replaces the value during compilation
- No runtime overhead
- Automatically updated when you bump the version

### Backend (Rust)

Get the version from `tauri.conf.json` at runtime:

```rust
use tauri::Config;

let config = Config::default();
let version = &config.package.version;
println!("App version: {}", version);
```

Or use the `env!("CARGO_PKG_VERSION")` macro (set from Cargo.toml):

```rust
const VERSION: &str = env!("CARGO_PKG_VERSION");
```

## Workflow Summary

```
Edit version.json
       ↓
git commit
       ↓
Pre-commit hook runs:
  ├→ sync-version.js (updates package.json, Cargo.toml, tauri.conf.json)
  ├→ Auto-stages synced files
  └→ Pre-commit checks continue
       ↓
Single commit with all synced files
```

## Why This System?

Single source of truth prevents version mismatches across different build systems (npm, cargo, Tauri). 
- ✅ Only edit `version.json`
- ✅ Automatic synchronization via pre-commit hook
- ✅ No manual file updates needed
- ✅ Future-proof for new version displays (use env variable)
