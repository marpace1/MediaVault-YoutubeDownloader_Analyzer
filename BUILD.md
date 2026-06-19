# MediaVault — Build & Release Guide

Everything you need to produce distributable installers and wire up
auto-updates.

---

## 1. Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- Native build toolchain (for `better-sqlite3`):
  - **Windows:** Visual Studio Build Tools → "Desktop development with C++"
  - **macOS:** `xcode-select --install`
  - **Linux:** `sudo apt install build-essential python3`

Install dependencies and rebuild native modules for Electron:

```bash
npm install
npm run rebuild   # electron-builder install-app-deps
```

---

## 2. Bundling the engines (yt-dlp + FFmpeg)

`electron-builder` is configured to copy `resources/bin/<os>/` into the packaged
app under `resources/bin` (see `build.extraResources` in `package.json`). At
runtime, `electron/utils/binaries.ts` resolves binaries from there first.

### yt-dlp (automated)
```bash
npm run fetch-binaries        # downloads yt-dlp for the current OS
npm run fetch-binaries:all    # downloads yt-dlp for win/mac/linux
```

### FFmpeg **and FFprobe** (manual or via ffmpeg-static)
FFmpeg builds are large and platform-specific. You must bundle **BOTH `ffmpeg`
AND `ffprobe`** — yt-dlp's post-processing (merging MKV/MP4, embedding
thumbnails/metadata) calls `ffprobe`, so an `ffmpeg`-only bundle causes
"ffprobe not found" errors even though the media downloads.

**A. Drop in static binaries** into the matching folder:
```
resources/bin/win/ffmpeg.exe   resources/bin/win/ffprobe.exe
resources/bin/mac/ffmpeg       resources/bin/mac/ffprobe
resources/bin/linux/ffmpeg     resources/bin/linux/ffprobe
```
Get static builds from https://ffmpeg.org/download.html (or gyan.dev for
Windows). Official static archives include both `ffmpeg` and `ffprobe`.

**B. Use ffmpeg-static / ffprobe-static during CI:**
```bash
npm i -D ffmpeg-static ffprobe-static
# copy node_modules/ffmpeg-static/ffmpeg(.exe)              -> resources/bin/<os>/
# copy node_modules/ffprobe-static/bin/<os>/<arch>/ffprobe  -> resources/bin/<os>/
```

> The build runs `npm run check-binaries` first and **fails** if `yt-dlp` is
> missing (warns if ffmpeg/ffprobe are missing). Use `--strict` to also fail on
> missing ffmpeg/ffprobe.
>
> If you don't bundle FFmpeg/FFprobe, the app still works when they're on the
> user's PATH or set in Settings — it just isn't fully self-contained.

Make the unix binaries executable before packaging:
```bash
chmod +x resources/bin/mac/* resources/bin/linux/*
```

---

## 3. Building installers

```bash
npm run build         # current platform
npm run build:win     # Windows x64 → NSIS installer (release/<v>/MediaVault-Setup-<v>.exe)
npm run build:mac     # macOS → DMG + ZIP
npm run build:linux   # Linux → AppImage + deb
```

`npm run build` runs, in order: `tsc --noEmit` → `vite build` (renderer + main +
preload) → `electron-builder`. Output lands in `release/<version>/`.

### Build matrix notes
- Build **Windows** installers on Windows (or via CI with wine).
- Build **macOS** installers on macOS (signing/notarization requires it).
- **Linux** can be built on Linux or in a Linux CI container.

---

## 4. Icons

Place these in `build/`:
- `icon.ico` (Windows, 256×256 multi-res)
- `icon.icns` (macOS)
- `icon.png` (Linux, 512×512 or 1024×1024) — already provided

Generate `.ico`/`.icns` from `build/icon.png` with tools like
`electron-icon-builder` or online converters.

---

## 5. Code signing (recommended for distribution)

### Windows
Set environment variables before `npm run build:win`:
```bash
set CSC_LINK=path\to\cert.pfx
set CSC_KEY_PASSWORD=yourpassword
```

### macOS (sign + notarize)
```bash
export CSC_LINK=path/to/cert.p12
export CSC_KEY_PASSWORD=yourpassword
export APPLE_ID=you@example.com
export APPLE_APP_SPECIFIC_PASSWORD=abcd-efgh-ijkl-mnop
export APPLE_TEAM_ID=XXXXXXXXXX
```
Hardened runtime + entitlements are already configured in
`build/entitlements.mac.plist`.

---

## 6. Auto-updater

The app uses `electron-updater` (`electron/services/updater.ts`). It checks for
updates 5 s after launch and every 6 hours, auto-downloads, and prompts the user
to restart & install via the in-app banner.

### Configure the publish target
In `package.json → build.publish`, set your GitHub repo:
```json
"publish": [{ "provider": "github", "owner": "your-org", "repo": "mediavault" }]
```

### Publish a release
```bash
# Requires a GitHub token with repo scope
export GH_TOKEN=ghp_xxx
npm run build:win   # add "-p always" by editing the script, or:
npx electron-builder --win --publish always
```
electron-builder uploads the installer **and** the `latest.yml` metadata the
updater reads. Bump `version` in `package.json` for each release.

> Auto-update is disabled in development (`app.isPackaged === false`).

---

## 7. Verifying a build locally

```bash
npm run typecheck   # tsc --noEmit  → must be clean
npm run lint        # eslint        → must be clean
npm run build       # produces installers in release/<version>/
```
