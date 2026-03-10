import React, { useState, useEffect, useRef } from 'react'
import type { ShellProfile } from '../types'

interface ShellSelectorProps {
  onSelect: (profile: ShellProfile) => void
  onClose: () => void
}

export function ShellSelector({ onSelect, onClose }: ShellSelectorProps) {
  const [profiles, setProfiles] = useState<ShellProfile[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.electronAPI.shell.getProfiles().then(setProfiles).catch(console.error)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-8 left-0 z-50 w-56 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden"
    >
      <div className="px-3 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border-color)]">
        New Terminal
      </div>
      {profiles.length === 0 && (
        <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Loading...</div>
      )}
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => { onSelect(profile); onClose() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left"
        >
          <span>{profile.icon ?? '💻'}</span>
          <span>{profile.name}</span>
        </button>
      ))}
    </div>
  )
}
