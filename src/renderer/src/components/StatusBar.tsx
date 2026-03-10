import React from 'react'
import { useTerminalStore } from '../stores/terminalStore'
import { useAIStore } from '../stores/aiStore'
import { useSettingsStore } from '../stores/settingsStore'

const PROVIDER_ICONS: Record<string, string> = {
  openai: '🔮',
  anthropic: '🧠',
  openrouter: '🌐',
  gemini: '✨',
  ollama: '🦙',
}

export function StatusBar() {
  const { tabs } = useTerminalStore()
  const { approvalQueue, isLoading } = useAIStore()
  const { settings, isConfigured } = useSettingsStore()
  const activeTab = tabs.find((t) => t.isActive)
  const providerIcon = PROVIDER_ICONS[settings.aiProvider] ?? '🤖'

  return (
    <div className="flex items-center h-6 px-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] select-none overflow-hidden shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {activeTab && (
          <>
            <span className={`flex items-center gap-1 ${activeTab.type === 'ssh' ? 'text-blue-300' : 'text-[var(--tab-active)]'}`}>
              {activeTab.type === 'ssh' ? '🔗' : '💻'}
              <span className="truncate max-w-[140px]">
                {activeTab.type === 'ssh'
                  ? `${activeTab.sshProfile?.username}@${activeTab.sshProfile?.host}`
                  : activeTab.shellProfile?.name ?? 'Terminal'}
              </span>
            </span>
            {activeTab.cwd && (
              <span className="truncate max-w-[200px] text-[var(--text-muted)]">
                📁 {activeTab.cwd}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {approvalQueue.length > 0 && (
          <span className="text-[var(--warning)]">
            ⚠ {approvalQueue.length} pending
          </span>
        )}
        {isLoading && (
          <span className="text-[var(--accent)] animate-pulse">⟳ Thinking...</span>
        )}
        <span
          className={`flex items-center gap-1 ${isConfigured ? 'text-green-400' : 'text-[var(--text-muted)]'}`}
          title={`${settings.aiProvider} — ${settings.aiModel}`}
        >
          {providerIcon}
          <span className="hidden sm:inline">{settings.aiProvider}</span>
          <span className="text-[var(--text-muted)]">/{settings.aiModel.split('/').pop()}</span>
        </span>
      </div>
    </div>
  )
}
