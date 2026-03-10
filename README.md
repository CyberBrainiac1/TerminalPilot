# TerminalPilot AI

> A PowerShell-style desktop terminal with a built-in AI chat sidebar — real PTY shell emulation, SSH support, and per-command approval workflow.

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ⚡ Quick Install (CLI)

Pick your platform and paste the commands into your terminal.

---

### 🪟 Windows — PowerShell

**Download the pre-built installer (no build required):**

```powershell
# Download the NSIS installer for Windows x64
Invoke-WebRequest -Uri "https://github.com/CyberBrainiac1/TerminalPilot/releases/latest/download/TerminalPilot-AI-Setup-x64.exe" `
  -OutFile "TerminalPilot-Setup.exe"

# Run the installer (installs to Program Files, creates Start Menu shortcut)
Start-Process -FilePath ".\TerminalPilot-Setup.exe" -Wait
```

**Build from source on Windows:**

```powershell
# Prerequisites: Node.js 20+, Git, Visual Studio Build Tools (C++ workload)
# Check Node version first — must be 20 or newer:
node --version

# Clone the repository
git clone https://github.com/CyberBrainiac1/TerminalPilot.git
cd TerminalPilot

# Install dependencies (--legacy-peer-deps required for native modules)
npm install --legacy-peer-deps

# Run in development mode (hot reload)
npm run dev

# — OR — build a distributable installer:
npm run make:win
# Output: dist\TerminalPilot-AI-Setup-x64.exe
```

---

### 🐧 Linux — bash / zsh

**Download the pre-built AppImage (no build required):**

```bash
# Install prerequisite (Debian/Ubuntu)
sudo apt-get install -y libsecret-1-0

# Download the AppImage
curl -L -o TerminalPilot.AppImage \
  https://github.com/CyberBrainiac1/TerminalPilot/releases/latest/download/TerminalPilot-AI-x86_64.AppImage

# Make it executable and run
chmod +x TerminalPilot.AppImage
./TerminalPilot.AppImage
```

**Build from source on Linux:**

```bash
# Prerequisites: Node.js 20+, Git, build tools
# Debian / Ubuntu:
sudo apt-get update && sudo apt-get install -y \
  git curl build-essential python3 libsecret-1-dev

# Fedora / RHEL:
# sudo dnf install -y git curl gcc-c++ make python3 libsecret-devel

# Install Node.js 20 via nvm (if not already installed):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc          # reload shell (or open a new terminal)
nvm install 20
nvm use 20
node --version            # should print v20.x.x

# Clone the repository
git clone https://github.com/CyberBrainiac1/TerminalPilot.git
cd TerminalPilot

# Install dependencies
npm install --legacy-peer-deps

# Run in development mode (hot reload)
npm run dev

# — OR — build a distributable AppImage:
npm run make:linux
# Output: dist/TerminalPilot-AI-x86_64.AppImage
```

---

### 🍎 macOS — Terminal / iTerm2

**Build from source on macOS:**

```bash
# Prerequisites: Node.js 20+, Git, Xcode Command Line Tools
xcode-select --install     # installs CLT if not already present

# Install Node.js 20 via Homebrew (recommended):
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version             # should print v20.x.x

# Clone the repository
git clone https://github.com/CyberBrainiac1/TerminalPilot.git
cd TerminalPilot

# Install dependencies
npm install --legacy-peer-deps

# Run in development mode (hot reload)
npm run dev

# — OR — build a distributable DMG:
npm run make:mac
# Output: dist/TerminalPilot-AI-*.dmg
```

---

### 🔑 First-Run Setup

After launching TerminalPilot AI for the first time a welcome wizard runs entirely in the app window and asks you to:

1. **Choose your default shell** — auto-detected from your system (PowerShell, bash, zsh, CMD, etc.)
2. **Choose your AI provider** — OpenAI, Anthropic Claude, OpenRouter, Google Gemini, or Ollama (local, no key needed)
3. **Enter your API key** — stored securely in the OS keychain, never written to disk as plain text

You can skip the API key step and add or change it later via **Settings → AI** (`Ctrl+,`).

---

## Features

- **PowerShell-style terminal** — classic `#012456` blue theme, Campbell color scheme, block cursor
- **AI chat sidebar** — always visible on the right; supports 5 providers (see below)
- **Multiple AI providers** — switch between OpenAI, Anthropic, OpenRouter, Google Gemini, and local Ollama in Settings
- **OpenRouter support** — access 100+ models (GPT-4o, Claude, Llama, Mistral, Phi-3) via a single API key
- **Real terminal emulator** — PTY-backed via `node-pty`; supports PowerShell, CMD, Git Bash, WSL, bash, zsh, fish
- **Multiple tabs** with shell profile switching
- **SSH session management** — key / password / agent auth, saved profiles
- **Command proposal + approval** — AI suggests commands, you approve / edit / reject before they run
- **Risk scanning** — color-coded risk levels (safe / moderate / high / critical)
- **Secret redaction** — API keys and tokens stripped before sending output to AI
- **Secure key storage** — OS keychain via `keytar`; keys are never stored as plain text

---

## AI Providers

Switch providers any time in **Settings → AI** (`Ctrl+,`):

| Provider | Icon | Key format | Notes |
|---|---|---|---|
| OpenAI | 🔮 | `sk-...` | GPT-4o, GPT-4o Mini, GPT-3.5 Turbo |
| Anthropic Claude | 🧠 | `sk-ant-...` | Claude 3.5 Sonnet, Haiku, Opus |
| OpenRouter | 🌐 | `sk-or-v1-...` | 100+ models; one key for all |
| Google Gemini | ✨ | `AIza...` | Gemini 2.0 Flash, 1.5 Pro/Flash |
| Ollama (local) | 🦙 | *(none)* | Runs on your machine — no cloud, no key |

Each provider stores its key independently in the keychain — you can configure multiple at once and switch freely.

---

## Configuration

### Changing AI Provider or Key

Open **Settings → AI** (`Ctrl+,`), click a provider pill, then enter your key and click **Save**.

### Shell Profiles

The app auto-detects available shells on startup:
- **Windows:** PowerShell 5, PowerShell 7, CMD, Git Bash, WSL
- **Linux/macOS:** bash, zsh, fish, sh

Custom profiles can be added in **Settings → Terminal**.

### SSH Profiles

Add SSH connection profiles in **Settings → SSH**. Supports:
- Private key authentication
- Password authentication (never stored in plain text)
- SSH agent forwarding

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+A` | Toggle AI sidebar |
| `Ctrl+C` | Copy / Interrupt process |
| `Ctrl+Shift+C` | Copy selection |
| `Ctrl+Shift+V` | Paste |

---

## Architecture

```
src/
  main/              # Electron main process (Node.js)
    terminal/        # PTY management, shell profiles, output capture
    ssh/             # SSH session management (ssh2)
    ai/              # AI provider (OpenAI/Anthropic/OpenRouter/Gemini/Ollama)
    security/        # Risk analyzer, secret redactor
    storage/         # Secure keychain storage, settings persistence
    ipc/             # IPC handler registrations
    models/          # Shared TypeScript interfaces
  preload/           # contextBridge IPC API exposed to renderer
  renderer/src/      # React 18 frontend (PowerShell blue theme)
    components/      # UI components (SidebarChat, SettingsDialog, TerminalPane…)
    stores/          # Zustand state (terminal tabs, AI chat, settings)
    hooks/           # useTerminal, useAI, useSettings
    types/           # Frontend type definitions + window.electronAPI types
```

---

## License

MIT
