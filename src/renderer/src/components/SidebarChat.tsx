import React, { useState, useRef, useEffect } from 'react'
import { useAI } from '../hooks/useAI'
import { useTerminalStore } from '../stores/terminalStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ChatMessage } from './ChatMessage'
import { SessionBadge } from './SessionBadge'

const SUGGESTIONS = [
  'Explain the last command',
  "What went wrong?",
  'How do I fix this error?',
  'Summarize recent output',
  'Help me set up a project',
]

export function SidebarChat() {
  const { messages, isLoading, clearChat, sendMessage } = useAI()
  const { tabs } = useTerminalStore()
  const { isConfigured } = useSettingsStore()
  const [input, setInput] = useState('')
  const [includeOutput, setIncludeOutput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeTab = tabs.find((t) => t.isActive)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text, includeOutput)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] border-l border-[var(--border-color)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] shrink-0">
        <span className="text-[var(--accent)] font-semibold text-sm">🤖 AI Pilot</span>
        <div className="flex items-center gap-2">
          {activeTab && <SessionBadge tab={activeTab} compact />}
          <button
            onClick={clearChat}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5 py-1 rounded hover:bg-[var(--bg-tertiary)]"
            title="Clear chat"
          >🗑</button>
        </div>
      </div>

      {!isConfigured && (
        <div className="mx-3 mt-3 px-3 py-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-300">
          ⚠ API key not set. Open Settings → AI to configure.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-[var(--text-muted)] text-sm mb-4">Ask anything about your terminal</p>
            <div className="space-y-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm ml-8">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-[var(--border-color)] shrink-0">
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={includeOutput}
            onChange={(e) => setIncludeOutput(e.target.checked)}
            className="w-3 h-3"
          />
          Include recent output
        </label>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send)"
            disabled={isLoading}
            rows={2}
            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent)] placeholder-[var(--text-muted)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 text-sm font-bold"
          >↑</button>
        </div>
      </div>
    </div>
  )
}
