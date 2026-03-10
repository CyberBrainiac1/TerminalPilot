import { useCallback } from 'react'
import { useTerminalStore } from '../stores/terminalStore'
import type { ShellProfile, SSHProfile } from '../types'

export function useTerminal() {
  const store = useTerminalStore()

  const openNewTab = useCallback(
    async (profile?: ShellProfile) => {
      try {
        let resolvedProfile = profile
        if (!resolvedProfile) {
          const profiles = await window.electronAPI.shell.getProfiles()
          resolvedProfile = profiles[0]
        }
        if (!resolvedProfile) return undefined

        const tabId = store.addTab({
          title: resolvedProfile.name,
          type: 'local',
          shellProfile: resolvedProfile,
          cwd: resolvedProfile.cwd,
        })
        return tabId
      } catch (err) {
        console.error('Failed to open tab:', err)
        return undefined
      }
    },
    [store]
  )

  const openSSHTab = useCallback(
    async (profile: SSHProfile, password?: string) => {
      try {
        const tabId = store.addTab({
          title: profile.name || `${profile.username}@${profile.host}`,
          type: 'ssh',
          sshProfile: profile,
        })
        await window.electronAPI.ssh.connect(profile, password)
        return tabId
      } catch (err) {
        console.error('Failed to open SSH tab:', err)
        return undefined
      }
    },
    [store]
  )

  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = store.tabs.find((t) => t.id === tabId)
      if (tab?.type === 'ssh' && tab.sshProfile) {
        try {
          await window.electronAPI.ssh.disconnect(tab.sshProfile.id)
        } catch { /* ignore */ }
      } else {
        try {
          await window.electronAPI.terminal.close(tabId)
        } catch { /* ignore */ }
      }
      store.removeTab(tabId)
    },
    [store]
  )

  return { ...store, openNewTab, openSSHTab, closeTab }
}
