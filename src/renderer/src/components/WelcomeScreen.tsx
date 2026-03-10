import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { ShellProfile } from '../types'

interface WelcomeScreenProps {
  shellProfiles: ShellProfile[]
  onComplete: () => void
}

export function WelcomeScreen({ shellProfiles, onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0)
  const [selectedShellId, setSelectedShellId] = useState(shellProfiles[0]?.id ?? '')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { updateSettings, setConfigured } = useSettingsStore()

  const finish = async () => {
    setSaving(true)
    setError('')
    try {
      await updateSettings({ defaultShellProfileId: selectedShellId, showWelcomeOnStart: false })
      if (apiKey.trim()) {
        await window.electronAPI.ai.setApiKey(apiKey.trim())
        setConfigured(true)
      }
      onComplete()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-3xl font-bold text-[var(--accent)]">TerminalPilot AI</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            Your AI-powered terminal companion
          </p>
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Choose your default shell</h2>
            <div className="space-y-2 mb-6">
              {shellProfiles.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">No shells detected. You can configure them in Settings.</p>
              )}
              {shellProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedShellId(profile.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                    selectedShellId === profile.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border-color)] hover:border-[var(--accent)]/50 text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="text-lg">{profile.icon ?? '💻'}</span>
                  <span className="font-medium">{profile.name}</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)] truncate max-w-[120px]">{profile.shell}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)] font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Connect your AI (optional)</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Enter your OpenAI API key to enable AI features. You can skip this and add it later in Settings.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--accent)] mb-1"
            />
            <p className="text-[var(--text-muted)] text-xs mb-5">
              🔒 Stored securely in OS keychain. Never written to disk in plain text.
            </p>
            {error && <p className="text-[var(--error)] text-xs mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >← Back</button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)] font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : apiKey ? 'Get Started' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
