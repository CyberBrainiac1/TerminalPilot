import React, { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import type { SSHProfile } from '../types'

let _idCounter = 0
function newId() { return `ssh-${++_idCounter}-${Date.now()}` }

export function SSHProfileManager() {
  const { settings, updateSettings } = useSettingsStore()
  const [editing, setEditing] = useState<SSHProfile | null>(null)
  const [isNew, setIsNew] = useState(false)

  const startNew = () => {
    setEditing({ id: newId(), name: '', host: '', port: 22, username: '', authType: 'key' })
    setIsNew(true)
  }

  const save = () => {
    if (!editing) return
    const profiles = isNew
      ? [...settings.sshProfiles, editing]
      : settings.sshProfiles.map((p) => (p.id === editing.id ? editing : p))
    updateSettings({ sshProfiles: profiles })
    setEditing(null)
  }

  const remove = (id: string) => {
    updateSettings({ sshProfiles: settings.sshProfiles.filter((p) => p.id !== id) })
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{isNew ? 'New SSH Profile' : 'Edit SSH Profile'}</h3>
        {(
          [
            { label: 'Profile Name', key: 'name', type: 'text', placeholder: 'My Server' },
            { label: 'Host', key: 'host', type: 'text', placeholder: '192.168.1.1' },
            { label: 'Port', key: 'port', type: 'number', placeholder: '22' },
            { label: 'Username', key: 'username', type: 'text', placeholder: 'ubuntu' },
            { label: 'Key Path', key: 'keyPath', type: 'text', placeholder: '~/.ssh/id_rsa' },
          ] as const
        ).map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
            <input
              type={type}
              value={String((editing as unknown as Record<string, unknown>)[key] ?? '')}
              onChange={(e) =>
                setEditing({ ...editing, [key]: type === 'number' ? parseInt(e.target.value) || 22 : e.target.value } as SSHProfile)
              }
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">Auth Type</label>
          <select
            value={editing.authType}
            onChange={(e) => setEditing({ ...editing, authType: e.target.value as SSHProfile['authType'] })}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="key">Private Key</option>
            <option value="password">Password</option>
            <option value="agent">SSH Agent</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2 bg-[var(--accent)] text-[var(--bg-primary)] rounded text-sm font-medium">Save</button>
          <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-[var(--border-color)] rounded text-sm text-[var(--text-secondary)]">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">SSH Profiles</h3>
        <button onClick={startNew} className="text-xs px-3 py-1.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded">+ Add</button>
      </div>
      {settings.sshProfiles.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No SSH profiles. Add one to connect to remote servers.</p>
      ) : (
        <div className="space-y-2">
          {settings.sshProfiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
              <div>
                <div className="text-sm font-medium">{profile.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{profile.username}@{profile.host}:{profile.port}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(profile); setIsNew(false) }} className="text-xs px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded">Edit</button>
                <button onClick={() => remove(profile.id)} className="text-xs px-2 py-1 text-[var(--error)] hover:bg-red-900/20 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
