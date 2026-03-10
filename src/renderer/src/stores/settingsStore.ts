import { create } from 'zustand'
import type { AppSettings, AIProviderType } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'openai',
  aiModel: 'gpt-4o',
  ollamaBaseUrl: 'http://localhost:11434/v1',
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
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
  providerConfigured: Record<AIProviderType, boolean>
  isLoading: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setConfigured: (v: boolean) => void
  reloadProviderStatus: (provider: AIProviderType) => Promise<void>
}

const ALL_PROVIDERS: AIProviderType[] = ['openai', 'anthropic', 'openrouter', 'gemini', 'ollama']

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isConfigured: false,
  providerConfigured: {
    openai: false,
    anthropic: false,
    openrouter: false,
    gemini: false,
    ollama: true, // Ollama is always "configured" (local)
  },
  isLoading: true,

  loadSettings: async () => {
    try {
      const [settings, ...providerStatuses] = await Promise.all([
        window.electronAPI.settings.get(),
        ...ALL_PROVIDERS.map((p) => window.electronAPI.ai.isProviderConfigured(p)),
      ])
      const providerConfigured = Object.fromEntries(
        ALL_PROVIDERS.map((p, i) => [p, providerStatuses[i]])
      ) as Record<AIProviderType, boolean>
      const activeProvider = (settings as AppSettings).aiProvider ?? 'openai'
      set({
        settings: { ...DEFAULT_SETTINGS, ...settings },
        isConfigured: providerConfigured[activeProvider] ?? false,
        providerConfigured,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial }
    set({ settings: updated })
    // When provider changes, re-check isConfigured
    if (partial.aiProvider !== undefined) {
      const configured = get().providerConfigured[partial.aiProvider as AIProviderType] ?? false
      set({ isConfigured: configured })
    }
    try {
      await window.electronAPI.settings.set(updated)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  },

  setConfigured: (v) => set({ isConfigured: v }),

  reloadProviderStatus: async (provider) => {
    try {
      const configured = await window.electronAPI.ai.isProviderConfigured(provider)
      set((state) => ({
        providerConfigured: { ...state.providerConfigured, [provider]: configured },
        isConfigured:
          state.settings.aiProvider === provider ? configured : state.isConfigured,
      }))
    } catch { /* ignore */ }
  },
}))
