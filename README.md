# TerminalPilot AI

> A standalone AI-powered desktop terminal — real PTY shell emulation, SSH support, and an integrated AI assistant with per-command approval.

![TerminalPilot AI](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real terminal emulator** — PTY-backed via `node-pty`, supports PowerShell, CMD, Git Bash, WSL, bash, zsh
- **Multiple tabs** with shell profile switching
- **SSH session management** — key/password/agent auth, saved profiles
- **AI chat sidebar** — powered by OpenAI (extensible to other providers)
- **Command proposal + approval** — AI suggests commands, you approve/edit/reject before they run
- **Risk scanning** — color-coded risk levels (safe / moderate / high / critical) for dangerous commands
- **Secret redaction** — API keys, tokens, and passwords are stripped before sending output to AI
- **Secure API key storage** — OS keychain via `keytar`
- **Tokyo Night dark theme** with xterm.js terminal rendering
- **Settings UI** — fonts, scrollback, AI config, SSH profiles, keyboard shortcuts

## Download

Pre-built installers are available on the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| Windows  | `TerminalPilot-AI-Setup-x64.exe` (NSIS installer) |
| Windows  | `TerminalPilot-AI-Portable-x64.exe` (portable, no install needed) |
| Linux    | `TerminalPilot-AI-x86_64.AppImage` |

> **Note:** Releases are built automatically by CI when a version tag is pushed. To trigger a release, push a tag like `v1.0.0`.

## Build from Source

### Prerequisites

- Node.js 20+
- Python 3 (for native module compilation)
- On Windows: Visual Studio Build Tools (C++ workload)
- On Linux: `build-essential libsecret-1-dev`

### Steps

```bash
# Clone
git clone https://github.com/CyberBrainiac1/TerminalPilot.git
cd TerminalPilot

# Install dependencies
npm install --legacy-peer-deps

# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Package (current platform)
npm run make

# Package Windows installer (run on Windows or via CI)
npm run make:win

# Package Linux AppImage
npm run make:linux
```

Packaged installers are output to the `dist/` directory.

## Configuration

### API Key

On first launch, the welcome screen prompts for your OpenAI API key. It is stored securely in the OS keychain (never written to disk as plain text).

You can also set/change/clear it via **Settings → AI**.

### Shell Profiles

The app auto-detects available shells on startup:
- **Windows:** PowerShell, PowerShell 7, CMD, Git Bash, WSL
- **Linux/macOS:** bash, zsh, fish, sh

Custom profiles can be added in Settings.

### SSH Profiles

Add SSH connection profiles in **Settings → SSH**. Supports:
- Private key authentication
- Password authentication (password never stored in plain text)
- SSH agent forwarding

## AI Features

The AI sidebar (toggle with `🤖` button or `Ctrl+Shift+A`) provides:

- **Free-form chat** about your terminal, errors, and workflows
- **Command proposals** — AI suggests commands in `bash`/`powershell` code blocks
- **Approval workflow** — every proposed command shows an approval card with:
  - Risk level badge (green/yellow/orange/red)
  - ▶ Run, ✏️ Edit, 📋 Copy, ✕ Reject buttons
  - Extra confirmation for high-risk commands
- **Include recent output** — checkbox to attach last 50 lines of terminal output for context
- **Automatic secret redaction** — sensitive patterns stripped before any output is sent to AI

## Architecture

```
src/
  main/              # Electron main process (Node.js)
    terminal/        # PTY management, shell profiles, output capture
    ssh/             # SSH session management (ssh2)
    ai/              # AI provider, prompt builder, approval manager
    security/        # Risk analyzer, secret redactor
    storage/         # Secure keychain storage, settings persistence
    ipc/             # IPC handler registrations
    models/          # Shared TypeScript interfaces
  preload/           # contextBridge IPC API exposed to renderer
  renderer/src/      # React 18 frontend
    components/      # UI components
    stores/          # Zustand state (terminal tabs, AI chat, settings)
    hooks/           # useTerminal, useAI, useSettings
    types/           # Frontend type definitions + window.electronAPI types
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+A` | Toggle AI sidebar |
| `Ctrl+C` | Copy / Interrupt process |

## License

MIT
