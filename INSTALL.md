# MediaVault — Installation Guide

This guide covers installing MediaVault as an **end user** (from a packaged
installer) and as a **developer** (from source).

---

## 1. End-user installation

### Windows
1. Download `MediaVault-Setup-<version>.exe` from the Releases page.
2. Run the installer. You can choose the install location and whether to create
   desktop/Start-menu shortcuts.
3. Launch **MediaVault** from the Start menu.

> Windows SmartScreen may warn about an unsigned app. Click **More info →
> Run anyway**, or ship a signed build (see BUILD.md).

### macOS
1. Download `MediaVault-<version>.dmg`.
2. Open the DMG and drag **MediaVault** into **Applications**.
3. First launch: right-click the app → **Open** (required for unsigned builds),
   then confirm.

### Linux
- **AppImage:** `chmod +x MediaVault-<version>.AppImage && ./MediaVault-<version>.AppImage`
- **Debian/Ubuntu:** `sudo apt install ./mediavault_<version>_amd64.deb`

---

## 2. Engine requirements (yt-dlp & FFmpeg)

MediaVault needs two external engines:

| Engine | Purpose |
|--------|---------|
| **yt-dlp** | Extracts metadata and downloads media from YouTube |
| **FFmpeg** | Merges video+audio, converts audio formats, embeds thumbnails/metadata |

**If you installed a packaged build that bundles the binaries, nothing to do.**

Otherwise, install them one of these ways:

### Option A — System install (simplest)
- **Windows:** `winget install yt-dlp.yt-dlp` and `winget install Gyan.FFmpeg`
- **macOS:** `brew install yt-dlp ffmpeg`
- **Linux:** `sudo apt install ffmpeg` and download yt-dlp from its releases, or
  `pipx install yt-dlp`

### Option B — Point MediaVault at custom paths
Open **Settings → Engine status → Set path** and select the `yt-dlp` and
`ffmpeg` executables manually. MediaVault re-checks availability immediately.

MediaVault shows a warning banner on the Home screen if either engine is missing.

---

## 3. Developer installation (from source)

**Prerequisites:** Node.js 18+ (20 recommended), npm 9+, and a C/C++ toolchain
for the native SQLite module:
- Windows: Visual Studio Build Tools (Desktop C++)
- macOS: `xcode-select --install`
- Linux: `build-essential python3`

```bash
git clone <your-repo-url> mediavault
cd mediavault
npm install
npm run rebuild        # build better-sqlite3 against Electron's ABI
npm run fetch-binaries # optional: download yt-dlp into resources/bin
npm run dev            # launch with hot reload
```

If you change Electron versions, re-run `npm run rebuild`.

---

## 4. Where data is stored

| Data | Location |
|------|----------|
| Download history + settings (SQLite) | `<userData>/mediavault.db` |
| Logs | `<userData>/logs/mediavault.log` |
| Default downloads | `~/Downloads/MediaVault` (configurable) |

`<userData>` resolves to:
- Windows: `%APPDATA%\MediaVault`
- macOS: `~/Library/Application Support/MediaVault`
- Linux: `~/.config/MediaVault`
