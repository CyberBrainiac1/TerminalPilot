import { create } from 'zustand'
import type { TerminalTab, ShellProfile, SSHProfile } from '../types'

let _tabCounter = 0
function newTabId(): string {
  return `tab-${++_tabCounter}-${Date.now()}`
}

interface TerminalState {
  tabs: TerminalTab[]
  activeTabId: string | null
  sidebarWidth: number
  addTab: (tab: Omit<TerminalTab, 'id' | 'isActive'>) => string
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<TerminalTab>) => void
  setSidebarWidth: (w: number) => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  sidebarWidth: 360,

  addTab: (tab) => {
    const id = newTabId()
    set((state) => ({
      tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), { ...tab, id, isActive: true }],
      activeTabId: id,
    }))
    return id
  },

  removeTab: (id) => {
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== id)
      let activeTabId: string | null = state.activeTabId
      if (activeTabId === id) {
        activeTabId = filtered[filtered.length - 1]?.id ?? null
      }
      return {
        tabs: filtered.map((t) => ({ ...t, isActive: t.id === activeTabId })),
        activeTabId,
      }
    })
  },

  setActiveTab: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === id })),
      activeTabId: id,
    }))
  },

  updateTab: (id, updates) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  setSidebarWidth: (w) => set({ sidebarWidth: w }),
}))

// Re-export types for convenience
export type { ShellProfile, SSHProfile }
