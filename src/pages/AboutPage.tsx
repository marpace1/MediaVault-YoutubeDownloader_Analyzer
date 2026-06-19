/** About page — MARPACE branding, socials, version, shortcuts. */
export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="section-title">About</h1>

      <div className="divider" />

      {/* ASCII logo */}
      <pre className="text-[10px] leading-tight text-muted select-none text-center">
{`

███╗   ███╗ █████╗ ██████╗ ██████╗  █████╗  ██████╗███████╗
████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
██╔████╔██║███████║██████╔╝██████╔╝███████║██║     █████╗  
██║╚██╔╝██║██╔══██║██╔══██╗██╔═══╝ ██╔══██║██║     ██╔══╝  
██║ ╚═╝ ██║██║  ██║██║  ██║██║     ██║  ██║╚██████╗███████╗
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝
                          M A R P A C E
`}
      </pre>

      <p className="text-center text-xs text-text-secondary">
        A premium desktop YouTube download manager by MARPACE.
      </p>

      <div className="divider" />

      {/* Socials */}
      <div>
        <p className="label mb-3">Connect</p>
        <div className="border border-border">
          {[
            ['GitHub', 'https://github.com/marpace1/MediaVault-YoutubeDownloader_Analyzer', 'github.com/marpace1/MediaVault'],
            ['Discord Server', 'https://discord.gg/PJp2uA9xt7', 'discord.gg/PJp2uA9xt7'],
            ['Discord', 'marpaceamv', 'marpaceamv'],
            ['Email', 'mailto:marpaceamv@gmail.com', 'marpaceamv@gmail.com'],
            ['YouTube', 'https://www.youtube.com/@marpace1', 'youtube.com/@marpace1'],
          ].map(([name, url, display]) => (
            <button
              key={name}
              onClick={() => window.open(url, '_blank')}
              className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-xs text-text-secondary transition-colors hover:bg-hover last:border-b-0"
            >
              <span className="font-medium text-text-primary">{name}</span>
              <span className="tabular-nums">{display}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Version info */}
      <div>
        <p className="label mb-3">Version</p>
        <div className="border border-border">
          {[
            ['MARPACE MediaVault', '1.0.0'],
            ['Electron', '32.x'],
            ['React', '18.3'],
            ['Vite', '5.4'],
            ['yt-dlp', 'latest'],
            ['FFmpeg', 'latest'],
          ].map(([name, ver]) => (
            <div
              key={name}
              className="flex items-center justify-between border-b border-border px-3 py-2 last:border-b-0"
            >
              <span className="text-xs text-text-secondary">{name}</span>
              <span className="text-xs font-medium text-text-primary tabular-nums">{ver}</span>
            </div>
          ))}
        </div>
      </div>

      {/* License */}
      <div>
        <p className="label mb-3">License</p>
        <div className="card">
          <p className="text-xs text-text-secondary leading-relaxed">
            MIT License. Copyright (c) 2026 MARPACE.
            This software is provided as-is, without warranty of any kind.
          </p>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div>
        <p className="label mb-3">Keyboard Shortcuts</p>
        <div className="border border-border">
          {[
            ['Ctrl+K', 'Command Palette'],
            ['Ctrl+L', 'Focus URL Bar'],
            ['Ctrl+V', 'Paste URL'],
            ['Ctrl+D', 'Downloads'],
            ['Ctrl+H', 'History'],
            ['Ctrl+,', 'Settings'],
            ['F5', 'Refresh'],
            ['Space', 'Pause / Resume'],
            ['Delete', 'Remove Item'],
            ['Escape', 'Close Dialog / Palette'],
          ].map(([key, desc]) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-border px-3 py-2 last:border-b-0"
            >
              <span className="text-xs text-text-secondary">{desc}</span>
              <span className="border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-primary tabular-nums">
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}