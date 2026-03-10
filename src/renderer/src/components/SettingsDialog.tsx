import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { SSHProfileManager } from './SSHProfileManager'
import type { AppSettings } from '../types'

interface SettingsDialogProps {
  onClose: () => void
}

type Tab = 'general' | 'terminal' | 'ai' | 'ssh' | 'shortcuts'

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { settings, updateSettings, isConfigured, setConfigured } = useSettingsStore()
  const [apiKey, setApiKey] = useState('')
  const [apiKeyMsg, setApiKeyMsg] = useState('')

  const saveApiKey = async () => {
    if (!apiKey.trim()) return
    await window.electronAPI.ai.setApiKey(apiKey.trim())
    setApiKey('')
    setConfigured(true)
    setApiKeyMsg('✅ Saved securely')
    setTimeout(() => setApiKeyMsg(''), 3000)
  }
  const clearApiKey = async () => {
    await window.electronAPI.ai.clearApiKey()
    setConfigured(false)
    setApiKeyMsg('Cleared')
    setTimeout(() => setApiKeyMsg(''), 3000)
  }

  const TABS: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'terminal', label: 'Terminal', icon: '💻' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'ssh', label: 'SSH', icon: '🔗' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-[700px] max-h-[80vh] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">×</button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-36 border-r border-[var(--border-color)] py-3 shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                  activeTab === t.id
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[var(--text-primary)]">
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
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={settings.showWelcomeOnStart}
                    onChange={(e) => updateSettings({ showWelcomeOnStart: e.target.checked })} className="w-4 h-4" />
                  Show welcome screen on startup
                </label>
              </>
            )}
            {activeTab === 'terminal' && (
              <>
                <h3 className="text-sm font-semibold mb-3">Terminal</h3>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Font Size: {settings.fontSize}px</label>
                  <input type="range" min={10} max={24} value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Font Family</label>
                  <input type="text" value={settings.fontFamily}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Scrollback: {settings.scrollback} lines</label>
                  <input type="range" min={1000} max={50000} step={1000} value={settings.scrollback}
                    onChange={(e) => updateSettings({ scrollback: parseInt(e.target.value) })} className="w-full" />
                </div>
              </>
            )}
            {activeTab === 'ai' && (
              <>
                <h3 className="text-sm font-semibold mb-3">AI Settings</h3>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">API Key</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isConfigured ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {isConfigured ? '● Configured' : '● Not set'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                      placeholder={isConfigured ? '(change key)' : 'sk-...'}
                      className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
                    <button onClick={saveApiKey} disabled={!apiKey.trim()}
                      className="px-3 py-2 bg-[var(--accent)] text-[var(--bg-primary)] rounded text-sm font-medium disabled:opacity-50">Save</button>
                    {isConfigured && (
                      <button onClick={clearApiKey} className="px-3 py-2 border border-[var(--error)]/30 text-[var(--error)] rounded text-sm">Clear</button>
                    )}
                  </div>
                  {apiKeyMsg && <p className="text-xs text-[var(--success)] mt-2">{apiKeyMsg}</p>}
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Model</label>
                  <select value={settings.aiModel} onChange={(e) => updateSettings({ aiModel: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                {(
                  [
                    ['captureOutput', 'Capture terminal output for AI context'],
                    ['includeCwdInContext', 'Include current directory in AI context'],
                    ['autoRedactSecrets', 'Auto-redact secrets before sending to AI'],
                    ['requireApproval', 'Require approval for AI-suggested commands'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer text-sm">
                    <input type="checkbox"
                      checked={Boolean(settings[key as keyof AppSettings])}
                      onChange={(e) => updateSettings({ [key]: e.target.checked })} className="w-4 h-4" />
                    {label}
                  </label>
                ))}
              </>
            )}
            {activeTab === 'ssh' && <SSHProfileManager />}
            {activeTab === 'shortcuts' && (
              <>
                <h3 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
                <div className="space-y-2">
                  {[
                    ['Ctrl+T', 'New tab'],
                    ['Ctrl+W', 'Close tab'],
                    ['Ctrl+,', 'Settings'],
                    ['Ctrl+Shift+A', 'Toggle AI sidebar'],
                    ['Ctrl+C', 'Copy / Interrupt'],
                    ['Ctrl+Shift+C', 'Copy selection'],
                    ['Ctrl+Shift+V', 'Paste'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--border-color)]/50">
                      <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
                      <kbd className="text-xs px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded font-mono text-[var(--text-muted)]">{key}</kbd>
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
