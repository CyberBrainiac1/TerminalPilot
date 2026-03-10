import React from 'react'
import type { ChatMessage as ChatMessageType } from '../types'
import { CommandProposalCard } from './CommandProposalCard'
import { formatTimestamp } from '../utils/formatting'

interface ChatMessageProps {
  message: ChatMessageType
}

function renderContent(content: string) {
  if (!content) return null
  const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lang = part.match(/^```(\w*)/)?.[1] ?? ''
      const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      return (
        <div key={i} className="my-2">
          {lang && <div className="text-xs text-[var(--text-muted)] mb-1">{lang}</div>}
          <pre className="chat-code-block text-[var(--success)] text-xs">{code}</pre>
        </div>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--warning)] text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>
  })
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%]">
          <div className="bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-[var(--text-primary)]">
            {message.content}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col mb-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm shrink-0 mt-0.5">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-[var(--text-primary)]">
            {renderContent(message.content)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
      {message.commandProposals && message.commandProposals.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {message.commandProposals.map((proposal) => (
            <CommandProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  )
}
