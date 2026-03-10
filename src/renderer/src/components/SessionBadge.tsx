import React from 'react'
import type { TerminalTab } from '../types'

interface SessionBadgeProps {
  tab: TerminalTab
  compact?: boolean
}

export function SessionBadge({ tab, compact = false }: SessionBadgeProps) {
  if (tab.type === 'ssh') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span>🔗</span>
        {!compact && <span>{tab.sshProfile?.host}</span>}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/50 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span>💻</span>
      {!compact && <span>{tab.shellProfile?.name || 'Local'}</span>}
    </span>
  )
}
