MediaVault — Build & Release Guide
Everything you need to produce distributable installers and wire up auto-updates.

1. Prerequisites
Node.js 18+ (20 recommended)
npm 9+
Native build toolchain (for better-sqlite3):
Windows: Visual Studio Build Tools → "Desktop development with C++"
macOS: xcode-select --install
Linux: sudo apt install build-essential python3
Install dependencies and rebuild native modules for Electron:

npm install
npm run rebuild   # electron-builder install-app-deps
2. Bundling the engines (yt-dlp + FFmpeg)
electron-builder is configured to copy resources/bin/<os>/ into the packaged app under resources/bin (see build.extraResources in package.json). At runtime, electron/utils/binaries.ts resolves binaries from there first.

yt-dlp (automated)
npm run fetch-binaries        # downloads yt-dlp for the current OS
npm run fetch-binaries:all    # downloads yt-dlp for win/mac/linux
FFmpeg and FFprobe (manual or via ffmpeg-static)
FFmpeg builds are large and platform-specific. You must bundle BOTH ffmpeg AND ffprobe — yt-dlp's post-processing (merging MKV/MP4, embedding thumbnails/metadata) calls ffprobe, so an ffmpeg-only bundle causes "ffprobe not found" errors even though the media downloads.

A. Drop in static binaries into the matching folder:

resources/bin/win/ffmpeg.exe   resources/bin/win/ffprobe.exe
resources/bin/mac/ffmpeg       resources/bin/mac/ffprobe
resources/bin/linux/ffmpeg     resources/bin/linux/ffprobe
Get static builds from https://ffmpeg.org/download.html (or gyan.dev for Windows). Official static archives include both ffmpeg and ffprobe.

B. Use ffmpeg-static / ffprobe-static during CI:

npm i -D ffmpeg-static ffprobe-static
# copy node_modules/ffmpeg-static/ffmpeg(.exe)              -> resources/bin/<os>/
# copy node_modules/ffprobe-static/bin/<os>/<arch>/ffprobe  -> resources/bin/<os>/
The build runs npm run check-binaries first and fails if yt-dlp is missing (warns if ffmpeg/ffprobe are missing). Use --strict to also fail on missing ffmpeg/ffprobe.

If you don't bundle FFmpeg/FFprobe, the app still works when they're on the user's PATH or set in Settings — it just isn't fully self-contained.

Make the unix binaries executable before packaging:

chmod +x resources/bin/mac/* resources/bin/linux/*
