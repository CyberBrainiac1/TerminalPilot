import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { AppSettings } from '../models/types';
import { getDefaultShellProfiles } from '../terminal/shellProfiles';

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  aiModel: 'gpt-4o',
  ollamaBaseUrl: 'http://localhost:11434/v1',
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  defaultShellProfileId: '',
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, monospace',
  terminalOpacity: 100,
  scrollback: 5000,
  captureOutput: true,
  includeEnvInContext: false,
  includeCwdInContext: true,
  autoRedactSecrets: true,
  requireApproval: true,
  showWelcomeOnStart: true,
  sshProfiles: [],
  shellProfiles: [],
};

function getSettingsPath(): string {
  const dir = app.getPath('userData');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, 'settings.json');
}

export function loadSettings(): AppSettings {
  try {
    const path = getSettingsPath();
    if (!existsSync(path)) {
      const shells = getDefaultShellProfiles();
      const defaults = {
        ...DEFAULT_SETTINGS,
        shellProfiles: shells,
        defaultShellProfileId: shells[0]?.id ?? '',
      };
      saveSettings(defaults);
      return defaults;
    }
    const raw = readFileSync(path, 'utf8');
    const parsed: Partial<AppSettings> = JSON.parse(raw) as Partial<AppSettings>;
    // Merge with defaults to handle missing fields
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    // Ensure shell profiles are populated
    if (!merged.shellProfiles || merged.shellProfiles.length === 0) {
      merged.shellProfiles = getDefaultShellProfiles();
      merged.defaultShellProfileId = merged.shellProfiles[0]?.id ?? '';
    }
    return merged;
  } catch {
    const shells = getDefaultShellProfiles();
    return {
      ...DEFAULT_SETTINGS,
      shellProfiles: shells,
      defaultShellProfileId: shells[0]?.id ?? '',
    };
  }
}

export function saveSettings(settings: AppSettings): void {
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

export function resetSettings(): AppSettings {
  const shells = getDefaultShellProfiles();
  const defaults = {
    ...DEFAULT_SETTINGS,
    shellProfiles: shells,
    defaultShellProfileId: shells[0]?.id ?? '',
  };
  saveSettings(defaults);
  return defaults;
}
