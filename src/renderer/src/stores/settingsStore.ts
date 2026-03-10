import { create } from 'zustand'
import type { AppSettings } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  aiModel: 'gpt-4o',
  defaultShellProfileId: '',
  theme: 'dark',
  fontSize: 14,
  fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
  terminalOpacity: 1,
  scrollback: 10000,
  captureOutput: true,
  includeEnvInContext: false,
  includeCwdInContext: true,
  autoRedactSecrets: true,
  requireApproval: true,
  showWelcomeOnStart: true,
  sshProfiles: [],
  shellProfiles: [],
}

export interface SettingsState {
  settings: AppSettings
  isConfigured: boolean
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setConfigured: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isConfigured: false,
  isLoading: true,

  loadSettings: async () => {
    try {
      const [settings, configured] = await Promise.all([
        window.electronAPI.settings.get(),
        window.electronAPI.ai.isConfigured(),
      ])
      set({ settings: { ...DEFAULT_SETTINGS, ...settings }, isConfigured: configured, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial }
    set({ settings: updated })
    try {
      await window.electronAPI.settings.set(updated)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  },

  setConfigured: (v) => set({ isConfigured: v }),
}))
