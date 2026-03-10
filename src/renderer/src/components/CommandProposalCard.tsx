import React, { useState } from 'react'
import type { CommandProposal } from '../types'
import { useAI } from '../hooks/useAI'

interface CommandProposalCardProps {
  proposal: CommandProposal
}

const RISK_BORDER: Record<string, string> = {
  safe: 'border-green-700/50 bg-green-900/10',
  moderate: 'border-yellow-600/50 bg-yellow-900/10',
  high: 'border-orange-600/50 bg-orange-900/10',
  critical: 'border-red-600/50 bg-red-900/10',
}
const RISK_BADGE: Record<string, string> = {
  safe: 'bg-green-900/50 text-green-400 border-green-700/50',
  moderate: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  high: 'bg-orange-900/50 text-orange-400 border-orange-700/50',
  critical: 'bg-red-900/50 text-red-400 border-red-700/50',
}
const RISK_ICON: Record<string, string> = {
  safe: '✅', moderate: '⚡', high: '⚠️', critical: '⛔',
}

export function CommandProposalCard({ proposal }: CommandProposalCardProps) {
  const { approveProposal, rejectProposal } = useAI()
  const [editing, setEditing] = useState(false)
  const [editedCmd, setEditedCmd] = useState(proposal.command)
  const [confirmRisk, setConfirmRisk] = useState(false)

  const isPending = proposal.status === 'pending'
  const isRunning = proposal.status === 'running'
  const isDone = ['completed', 'failed', 'rejected'].includes(proposal.status)
  const isHighRisk = proposal.riskLevel === 'high' || proposal.riskLevel === 'critical'

  const handleApprove = () => {
    if (isHighRisk && !confirmRisk) {
      setConfirmRisk(true)
      return
    }
    approveProposal(proposal.id, editing ? editedCmd : undefined)
    setConfirmRisk(false)
  }

  return (
    <div className={`border rounded-lg p-3 text-sm ${RISK_BORDER[proposal.riskLevel] ?? RISK_BORDER.safe}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-muted)]">Proposed Command</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${RISK_BADGE[proposal.riskLevel] ?? RISK_BADGE.safe}`}>
          {RISK_ICON[proposal.riskLevel] ?? '?'} {proposal.riskLevel}
        </span>
      </div>

      {editing ? (
        <textarea
          value={editedCmd}
          onChange={(e) => setEditedCmd(e.target.value)}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded p-2 font-mono text-xs text-[var(--success)] resize-y min-h-[48px] focus:outline-none focus:border-[var(--accent)]"
          rows={3}
        />
      ) : (
        <pre className="bg-[var(--bg-secondary)] rounded p-2 font-mono text-xs text-[var(--success)] overflow-x-auto whitespace-pre-wrap break-all">
          {proposal.editedCommand ?? proposal.command}
        </pre>
      )}

      {proposal.explanation && (
        <p className="text-xs text-[var(--text-muted)] mt-1.5">{proposal.explanation}</p>
      )}
      {proposal.riskReason && (
        <p className="text-xs text-[var(--warning)] mt-1">⚠ {proposal.riskReason}</p>
      )}
      {confirmRisk && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-300">
          ⛔ High-risk command. Click Approve again to confirm.
        </div>
      )}
      {proposal.output && (
        <div className="mt-2">
          <div className="text-xs text-[var(--text-muted)] mb-1">
            {proposal.status === 'completed' ? '✅ Output' : '❌ Error'}
          </div>
          <pre className="bg-[var(--bg-secondary)] rounded p-2 text-xs max-h-24 overflow-y-auto text-[var(--text-secondary)] whitespace-pre-wrap break-all">
            {proposal.output}
          </pre>
        </div>
      )}

      {isPending && (
        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={handleApprove}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${isHighRisk ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700/40'}`}
          >
            {confirmRisk ? '⛔ Confirm' : '▶ Run'}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="px-2 py-1 rounded text-xs bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)]"
            title="Edit command"
          >✏️</button>
          <button
            onClick={() => navigator.clipboard.writeText(editing ? editedCmd : proposal.command)}
            className="px-2 py-1 rounded text-xs bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)]"
            title="Copy"
          >📋</button>
          <button
            onClick={() => rejectProposal(proposal.id)}
            className="px-2 py-1 rounded text-xs text-[var(--error)] border border-[var(--error)]/20 hover:bg-red-900/20"
          >✕</button>
        </div>
      )}
      {isRunning && (
        <div className="mt-2 text-xs text-[var(--accent)] animate-pulse">⟳ Running...</div>
      )}
      {isDone && !isRunning && (
        <div className={`mt-2 text-xs ${proposal.status === 'completed' ? 'text-[var(--success)]' : proposal.status === 'rejected' ? 'text-[var(--text-muted)]' : 'text-[var(--error)]'}`}>
          {proposal.status === 'completed' ? '✓ Completed' : proposal.status === 'rejected' ? '✕ Rejected' : '✗ Failed'}
        </div>
      )}
    </div>
  )
}
