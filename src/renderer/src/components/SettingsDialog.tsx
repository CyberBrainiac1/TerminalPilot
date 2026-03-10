import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { SSHProfileManager } from './SSHProfileManager'
import type { AppSettings, AIProviderType } from '../types'

interface SettingsDialogProps {
  onClose: () => void
}

type Tab = 'general' | 'terminal' | 'ai' | 'ssh' | 'shortcuts'

// ─── Provider metadata ──────────────────────────────────────────────────────

interface ProviderMeta {
  label: string
  icon: string
  placeholder: string
  needsKey: boolean
  models: Array<{ value: string; label: string }>
  supportsCustomModel: boolean
  extraFields?: Array<{ key: keyof AppSettings; label: string; placeholder: string }>
}

const PROVIDERS: Record<AIProviderType, ProviderMeta> = {
  openai: {
    label: 'OpenAI',
    icon: '🔮',
    placeholder: 'sk-...',
    needsKey: true,
    supportsCustomModel: true,
    models: [
      { value: 'gpt-4o',                label: 'GPT-4o (recommended)' },
      { value: 'gpt-4o-mini',           label: 'GPT-4o Mini (fast)' },
      { value: 'gpt-4-turbo',           label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo',         label: 'GPT-3.5 Turbo (cheap)' },
    ],
  },
  anthropic: {
    label: 'Anthropic Claude',
    icon: '🧠',
    placeholder: 'sk-ant-...',
    needsKey: true,
    supportsCustomModel: true,
    models: [
      { value: 'claude-opus-4-5',        label: 'Claude 3.5 Opus (most capable)' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (balanced)' },
      { value: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku (fast)' },
      { value: 'claude-3-haiku-20240307',   label: 'Claude 3 Haiku (cheap)' },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    icon: '🌐',
    placeholder: 'sk-or-v1-...',
    needsKey: true,
    supportsCustomModel: true,
    extraFields: [
      {
        key: 'openrouterBaseUrl',
        label: 'Base URL',
        placeholder: 'https://openrouter.ai/api/v1',
      },
    ],
    models: [
      { value: 'openai/gpt-4o',                       label: 'OpenAI GPT-4o' },
      { value: 'openai/gpt-4o-mini',                  label: 'OpenAI GPT-4o Mini' },
      { value: 'anthropic/claude-3.5-sonnet',         label: 'Anthropic Claude 3.5 Sonnet' },
      { value: 'anthropic/claude-3-haiku',            label: 'Anthropic Claude 3 Haiku' },
      { value: 'google/gemini-pro-1.5',               label: 'Google Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.1-70b-instruct',  label: 'Meta Llama 3.1 70B' },
      { value: 'meta-llama/llama-3.1-8b-instruct',   label: 'Meta Llama 3.1 8B (free)' },
      { value: 'mistralai/mistral-nemo',              label: 'Mistral Nemo (free)' },
      { value: 'microsoft/phi-3-medium-128k-instruct', label: 'Microsoft Phi-3 Medium (free)' },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    icon: '✨',
    placeholder: 'AIza...',
    needsKey: true,
    supportsCustomModel: true,
    models: [
      { value: 'gemini-2.0-flash',     label: 'Gemini 2.0 Flash (recommended)' },
      { value: 'gemini-1.5-pro',       label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash',     label: 'Gemini 1.5 Flash (fast)' },
      { value: 'gemini-1.0-pro',       label: 'Gemini 1.0 Pro' },
    ],
  },
  ollama: {
    label: 'Ollama (local)',
    icon: '🦙',
    placeholder: '',
    needsKey: false,
    supportsCustomModel: true,
    extraFields: [
      {
        key: 'ollamaBaseUrl',
        label: 'Ollama URL',
        placeholder: 'http://localhost:11434/v1',
      },
    ],
    models: [
      { value: 'llama3.1',   label: 'llama3.1' },
      { value: 'llama3.2',   label: 'llama3.2' },
      { value: 'mistral',    label: 'mistral' },
      { value: 'codellama',  label: 'codellama' },
      { value: 'phi3',       label: 'phi3' },
    ],
  },
}

// ─── Provider Key Section ────────────────────────────────────────────────────

function ProviderKeySection({
  provider,
  meta,
}: {
  provider: AIProviderType
  meta: ProviderMeta
}) {
  const { providerConfigured, reloadProviderStatus } = useSettingsStore()
  const [key, setKey] = useState('')
  const [msg, setMsg] = useState('')
  const configured = providerConfigured[provider] ?? false

  const save = async () => {
    if (!key.trim()) return
    await window.electronAPI.ai.setProviderKey(provider, key.trim())
    setKey('')
    setMsg('✅ Saved securely')
    await reloadProviderStatus(provider)
    setTimeout(() => setMsg(''), 3000)
  }

  const clear = async () => {
    await window.electronAPI.ai.clearProviderKey(provider)
    setMsg('Cleared')
    await reloadProviderStatus(provider)
    setTimeout(() => setMsg(''), 3000)
  }

  if (!meta.needsKey) {
    return (
      <div className="px-3 py-2 bg-green-900/20 border border-green-700/40 rounded text-xs text-green-400">
        🦙 No API key needed — Ollama runs locally on your machine
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{meta.label} API Key</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            configured ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}
        >
          {configured ? '● Configured' : '● Not set'}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          placeholder={configured ? '(update key)' : meta.placeholder}
          className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={save}
          disabled={!key.trim()}
          className="px-3 py-2 bg-[var(--accent)] text-white rounded text-sm font-medium disabled:opacity-50"
        >
          Save
        </button>
        {configured && (
          <button
            onClick={clear}
            className="px-3 py-2 border border-[var(--error)]/30 text-[var(--error)] rounded text-sm"
          >
            Clear
          </button>
        )}
      </div>
      {msg && <p className="text-xs text-[var(--success)]">{msg}</p>}
    </div>
  )
}

// ─── AI Tab (main) ───────────────────────────────────────────────────────────

function AISettingsTab() {
  const { settings, updateSettings, providerConfigured } = useSettingsStore()
  const [customModel, setCustomModel] = useState(false)

  const provider = settings.aiProvider
  const meta = PROVIDERS[provider]
  const configured = providerConfigured[provider] ?? provider === 'ollama'

  const handleProviderChange = (p: AIProviderType) => {
    // Pick a sensible default model for the new provider
    const defaultModel = PROVIDERS[p].models[0]?.value ?? ''
    updateSettings({ aiProvider: p, aiModel: defaultModel })
    setCustomModel(false)
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold">AI Provider</h3>

      {/* Provider selector pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROVIDERS) as AIProviderType[]).map((p) => {
          const m = PROVIDERS[p]
          const ok = providerConfigured[p] ?? p === 'ollama'
          return (
            <button
              key={p}
              onClick={() => handleProviderChange(p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                provider === p
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {ok && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-0.5" title="Configured" />}
            </button>
          )
        })}
      </div>

      {/* API key for active provider */}
      <ProviderKeySection provider={provider} meta={meta} />

      {/* Extra fields (e.g. base URL) */}
      {meta.extraFields?.map((field) => (
        <div key={field.key}>
          <label className="block text-xs text-[var(--text-muted)] mb-1">{field.label}</label>
          <input
            type="text"
            value={String(settings[field.key] ?? '')}
            onChange={(e) =>
              updateSettings({ [field.key]: e.target.value } as Partial<AppSettings>)
            }
            placeholder={field.placeholder}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      ))}

      {/* Model selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-[var(--text-muted)]">Model</label>
          {meta.supportsCustomModel && (
            <button
              onClick={() => setCustomModel(!customModel)}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              {customModel ? 'Use preset' : 'Enter custom model'}
            </button>
          )}
        </div>
        {customModel ? (
          <input
            type="text"
            value={settings.aiModel}
            onChange={(e) => updateSettings({ aiModel: e.target.value })}
            placeholder="model-name"
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
        ) : (
          <select
            value={meta.models.some((m) => m.value === settings.aiModel) ? settings.aiModel : '__custom__'}
            onChange={(e) => {
              if (e.target.value === '__custom__') { setCustomModel(true); return }
              updateSettings({ aiModel: e.target.value })
            }}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            {meta.models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
            {!meta.models.some((m) => m.value === settings.aiModel) && (
              <option value="__custom__">{settings.aiModel} (custom)</option>
            )}
          </select>
        )}
      </div>

      {/* Provider status banner */}
      {!configured && provider !== 'ollama' && (
        <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-700/40 rounded text-xs text-yellow-300">
          ⚠ Enter an API key above to use {meta.label}
        </div>
      )}

      {/* Behavior toggles */}
      <div className="border-t border-[var(--border-color)] pt-4 space-y-2">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Behavior</h4>
        {(
          [
            ['captureOutput',     'Capture terminal output for AI context'],
            ['includeCwdInContext', 'Include current directory in AI context'],
            ['autoRedactSecrets', 'Auto-redact secrets before sending to AI'],
            ['requireApproval',   'Require approval for AI-suggested commands'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings[key as keyof AppSettings])}
              onChange={(e) => updateSettings({ [key]: e.target.checked })}
              className="w-4 h-4"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Main SettingsDialog ─────────────────────────────────────────────────────

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { settings, updateSettings } = useSettingsStore()

  const TABS: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'general',   label: 'General',   icon: '⚙️' },
    { id: 'terminal',  label: 'Terminal',  icon: '💻' },
    { id: 'ai',        label: 'AI',        icon: '🤖' },
    { id: 'ssh',       label: 'SSH',       icon: '🔗' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[720px] max-h-[85vh] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-tertiary)]">
          <h2 className="text-base font-semibold">Settings</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">×</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <div className="w-36 border-r border-[var(--border-color)] py-3 shrink-0 bg-[var(--bg-tertiary)]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                  activeTab === t.id
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-r-2 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[var(--text-primary)]">
            {/* ── General ──────────────────────────────────────── */}
            {activeTab === 'general' && (
              <>
                <h3 className="text-sm font-semibold mb-3">General</h3>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSettings({ theme: e.target.value as AppSettings['theme'] })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="dark">Dark (PowerShell)</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={settings.showWelcomeOnStart}
                    onChange={(e) => updateSettings({ showWelcomeOnStart: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Show welcome screen on startup
                </label>
              </>
            )}

            {/* ── Terminal ─────────────────────────────────────── */}
            {activeTab === 'terminal' && (
              <>
                <h3 className="text-sm font-semibold mb-3">Terminal</h3>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Font Size: {settings.fontSize}px
                  </label>
                  <input
                    type="range" min={10} max={24} value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Font Family</label>
                  <input
                    type="text" value={settings.fontFamily}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Scrollback: {settings.scrollback.toLocaleString()} lines
                  </label>
                  <input
                    type="range" min={1000} max={50000} step={1000} value={settings.scrollback}
                    onChange={(e) => updateSettings({ scrollback: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* ── AI ───────────────────────────────────────────── */}
            {activeTab === 'ai' && <AISettingsTab />}

            {/* ── SSH ──────────────────────────────────────────── */}
            {activeTab === 'ssh' && <SSHProfileManager />}

            {/* ── Shortcuts ────────────────────────────────────── */}
            {activeTab === 'shortcuts' && (
              <>
                <h3 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
                <div className="space-y-1">
                  {[
                    ['Ctrl+T',       'New tab'],
                    ['Ctrl+W',       'Close tab'],
                    ['Ctrl+,',       'Settings'],
                    ['Ctrl+Shift+A', 'Toggle AI sidebar'],
                    ['Ctrl+C',       'Copy / Interrupt'],
                    ['Ctrl+Shift+C', 'Copy selection'],
                    ['Ctrl+Shift+V', 'Paste'],
                  ].map(([key, desc]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-[var(--border-color)]/40"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
                      <kbd className="text-xs px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded font-mono text-[var(--text-muted)]">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
