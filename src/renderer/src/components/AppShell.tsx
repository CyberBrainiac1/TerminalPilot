import React, { useEffect, useState } from 'react'
import { TabBar } from './TabBar'
import { TerminalPane } from './TerminalPane'
import { SidebarChat } from './SidebarChat'
import { StatusBar } from './StatusBar'
import { SettingsDialog } from './SettingsDialog'
import { SplitPaneManager } from './SplitPaneManager'
import { useTerminalStore } from '../stores/terminalStore'
import { useAIStore } from '../stores/aiStore'
import { useTerminal } from '../hooks/useTerminal'

export function AppShell() {
  const { tabs, sidebarWidth, setSidebarWidth } = useTerminalStore()
  const { sidebarOpen, setSidebarOpen } = useAIStore()
  const { openNewTab } = useTerminal()
  const [showSettings, setShowSettings] = useState(false)

  // Open first tab on mount
  useEffect(() => {
    if (tabs.length === 0) {
      openNewTab()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sidebarOpen, setSidebarOpen])

  const terminalArea = (
    <div className="relative w-full h-full">
      {tabs.map((tab) => (
        <TerminalPane key={tab.id} tab={tab} isActive={tab.isActive} />
      ))}
      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
          Click + to open a new terminal tab
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] overflow-hidden">
      <TabBar />
      <SplitPaneManager
        left={terminalArea}
        right={<SidebarChat />}
        rightWidth={sidebarWidth}
        onRightWidthChange={setSidebarWidth}
        showRight={sidebarOpen}
      />
      <StatusBar />
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  )
}
