import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { ShellProfile, AIProviderType } from '../types'

interface WelcomeScreenProps {
  shellProfiles: ShellProfile[]
  onComplete: () => void
}

const PROVIDERS: Array<{ id: AIProviderType; label: string; icon: string; placeholder: string; needsKey: boolean }> = [
  { id: 'openai',     label: 'OpenAI',          icon: '🔮', placeholder: 'sk-...',          needsKey: true },
  { id: 'anthropic',  label: 'Anthropic Claude', icon: '🧠', placeholder: 'sk-ant-...',      needsKey: true },
  { id: 'openrouter', label: 'OpenRouter',       icon: '🌐', placeholder: 'sk-or-v1-...',    needsKey: true },
  { id: 'gemini',     label: 'Google Gemini',    icon: '✨', placeholder: 'AIza...',         needsKey: true },
  { id: 'ollama',     label: 'Ollama (local)',   icon: '🦙', placeholder: '',                needsKey: false },
]

const DEFAULT_MODELS: Record<AIProviderType, string> = {
  openai:     'gpt-4o',
  anthropic:  'claude-3-5-sonnet-20241022',
  openrouter: 'openai/gpt-4o',
  gemini:     'gemini-2.0-flash',
  ollama:     'llama3.1',
}

export function WelcomeScreen({ shellProfiles, onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0)
  const [selectedShellId, setSelectedShellId] = useState(shellProfiles[0]?.id ?? '')
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('openai')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { updateSettings, reloadProviderStatus } = useSettingsStore()

  const selectedProviderMeta = PROVIDERS.find((p) => p.id === selectedProvider)!

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      await updateSettings({
        defaultShellProfileId: selectedShellId,
        showWelcomeOnStart: false,
        aiProvider: selectedProvider,
        aiModel: DEFAULT_MODELS[selectedProvider],
      })
      if (apiKey.trim() && selectedProviderMeta.needsKey) {
        await window.electronAPI.ai.setProviderKey(selectedProvider, apiKey.trim())
        await reloadProviderStatus(selectedProvider)
      }
      onComplete()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full text-[var(--text-primary)]"
      style={{ background: 'linear-gradient(135deg, #0c1f3d 0%, #012456 60%, #001533 100%)' }}
    >
      <div className="w-full max-w-lg px-8">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-3xl font-bold text-[var(--tab-active)]">TerminalPilot AI</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            PowerShell-style terminal with AI superpowers
          </p>
        </div>

        {/* Step 0 — Shell selection */}
        {step === 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4">Choose your default shell</h2>
            <div className="space-y-2 mb-6">
              {shellProfiles.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  No shells detected. Configure them later in Settings.
                </p>
              )}
              {shellProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedShellId(profile.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                    selectedShellId === profile.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border-color)] hover:border-[var(--accent)]/40 text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="text-lg">{profile.icon ?? '💻'}</span>
                  <span className="font-medium">{profile.name}</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)] truncate max-w-[140px] font-mono">
                    {profile.shell}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Next → Choose AI Provider
            </button>
          </div>
        )}

        {/* Step 1 — AI Provider selection */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold mb-4">Choose your AI provider</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${
                    selectedProvider === p.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border-color)] hover:border-[var(--accent)]/40 text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)]"
              >
                Next → Configure Key
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — API key entry */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{selectedProviderMeta.icon}</span>
              <h2 className="text-base font-semibold">{selectedProviderMeta.label} API Key</h2>
            </div>

            {selectedProviderMeta.needsKey ? (
              <>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  Enter your API key to enable AI features. You can skip this and add it later in{' '}
                  <strong>Settings → AI</strong>.
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedProviderMeta.placeholder}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--accent)] mb-1"
                />
                <p className="text-[var(--text-muted)] text-xs mb-5">
                  🔒 Stored securely in your OS keychain — never written to disk as plain text.
                </p>
              </>
            ) : (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700/40 rounded text-sm text-green-400">
                🦙 Ollama runs locally — no API key needed. Make sure Ollama is running on your machine.
              </div>
            )}

            {error && <p className="text-[var(--error)] text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : apiKey || !selectedProviderMeta.needsKey
                    ? '🚀 Get Started'
                    : 'Skip for now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
