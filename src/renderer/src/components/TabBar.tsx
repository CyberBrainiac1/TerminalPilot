import React, { useState, useRef, useEffect } from 'react'
import { useTerminalStore } from '../stores/terminalStore'
import { useTerminal } from '../hooks/useTerminal'
import { useAIStore } from '../stores/aiStore'
import type { ShellProfile } from '../types'
import { ShellSelector } from './ShellSelector'

export function TabBar() {
  const { tabs, setActiveTab } = useTerminalStore()
  const { openNewTab, closeTab } = useTerminal()
  const { setSidebarOpen, sidebarOpen } = useAIStore()
  const [showShellSelector, setShowShellSelector] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)
  const selectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenu) setContextMenu(null)
      if (showShellSelector && selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setShowShellSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu, showShellSelector])

  const handleNewTab = async (profile?: ShellProfile) => {
    await openNewTab(profile)
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  const handleRename = (tabId: string) => {
    const name = window.prompt('Tab name:')
    if (name) useTerminalStore.getState().updateTab(tabId, { title: name })
    setContextMenu(null)
  }

  return (
    <div className="flex items-center h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] select-none shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-3 text-[var(--accent)] font-bold text-sm shrink-0">🚀</div>

      {/* Tabs */}
      <div className="flex items-end h-full flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`group relative flex items-center gap-1.5 px-3 h-9 max-w-[160px] cursor-pointer shrink-0 border-t-2 transition-colors ${
              tab.isActive
                ? 'bg-[var(--bg-primary)] border-t-[var(--tab-active)] text-[var(--text-primary)]'
                : 'bg-transparent border-t-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span className="text-xs shrink-0">
              {tab.type === 'ssh' ? '🔗' : (tab.shellProfile?.icon ?? '💻')}
            </span>
            <span className="text-xs truncate">{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
            >×</button>
          </div>
        ))}
      </div>

      {/* New tab */}
      <div ref={selectorRef} className="relative shrink-0">
        <button
          onClick={() => setShowShellSelector(!showShellSelector)}
          className="flex items-center justify-center w-8 h-8 mx-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-lg leading-none"
          title="New Tab"
        >+</button>
        {showShellSelector && (
          <ShellSelector
            onSelect={(p) => { handleNewTab(p); setShowShellSelector(false) }}
            onClose={() => setShowShellSelector(false)}
          />
        )}
      </div>

      {/* AI sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`shrink-0 flex items-center justify-center w-8 h-8 mr-2 rounded transition-colors ${
          sidebarOpen
            ? 'text-[var(--accent)] bg-[var(--accent)]/10'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
        title="Toggle AI Sidebar"
      >🤖</button>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden py-1 min-w-[120px]"
        >
          <button
            onClick={() => handleRename(contextMenu.tabId)}
            className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          >Rename</button>
          <button
            onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null) }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-secondary)] text-[var(--error)]"
          >Close</button>
        </div>
      )}
    </div>
  )
}
